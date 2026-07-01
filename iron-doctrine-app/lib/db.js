// =====================================================================
//  lib/db.js — Postgres data layer (Supabase, service-role).
//
//  Drop-in replacement for lib/notion.js: EVERY exported function keeps
//  the same name, signature, and return shape, so no caller changes.
//  lib/notion.js now just re-exports this file.
//
//  Connection: service-role client (bypasses RLS). All reads/writes are
//  server-mediated — "server mediates everything", RLS is the backstop.
// =====================================================================

import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase/admin.js";
import { DEMO } from "./demo.js";
import { normalizeLang } from "./i18n.js";

// True when Postgres is configured. (Name kept as `hasNotion` for drop-in
// compatibility — callers across the app check this flag.)
export const hasNotion = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Lazy singleton service-role client.
let _sb = null;
function sb() {
  if (!_sb) _sb = createAdminClient();
  return _sb;
}

// ---- Exercise library (cached, mirrors the old perf optimization) ----
async function fetchExerciseLibraryArray() {
  const { data, error } = await sb()
    .from("exercises")
    .select("id,name_en,name_cz,cue_en,cue_cz,video");
  if (error) {
    console.error("exercise fetch failed:", error.message);
    return [];
  }
  return (data || []).map((e) => ({
    id: e.id,
    nameEN: e.name_en || "",
    nameCZ: e.name_cz || "",
    cueEN: e.cue_en || "",
    cueCZ: e.cue_cz || "",
    video: e.video || "",
  }));
}

// Same cache key + tag as before, so any revalidateTag("exercise-library") still works.
const getCachedExerciseLibrary = unstable_cache(
  fetchExerciseLibraryArray,
  ["exercise-library-v1"],
  { revalidate: 3600, tags: ["exercise-library"] }
);

async function loadExerciseLibrary() {
  if (!hasNotion) return new Map();
  const arr = await getCachedExerciseLibrary();
  const map = new Map();
  for (const e of arr) {
    map.set(e.id, { nameEN: e.nameEN, nameCZ: e.nameCZ, cueEN: e.cueEN, cueCZ: e.cueCZ, video: e.video });
  }
  return map;
}

// Active record of a given type for a client (programs / meal_plans / supplement_protocols).
async function activeFor(table, clientId) {
  const { data, error } = await sb()
    .from(table)
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "Active")
    .limit(1);
  if (error) {
    console.error(`activeFor ${table} failed:`, error.message);
    return null;
  }
  return (data && data[0]) || null;
}

// Assemble a program's days from its program_exercises rows, resolved against the library.
async function buildProgramDays(programId) {
  try {
    const { data, error } = await sb()
      .from("program_exercises")
      .select("*")
      .eq("program_id", programId)
      .order("day", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw error;
    if (!data || !data.length) return [];

    const lib = await loadExerciseLibrary();
    const daysMap = new Map();
    for (const row of data) {
      const dayNum = row.day ?? 0;
      const dayLabel = row.day_label || "";
      const ex = row.exercise_id ? lib.get(row.exercise_id) || null : null;
      const fallbackName = row.label || "";
      const item = {
        nameEN: ex ? ex.nameEN : fallbackName,
        nameCZ: ex ? ex.nameCZ || ex.nameEN : fallbackName,
        cueEN: ex ? ex.cueEN : "",
        cueCZ: ex ? ex.cueCZ || ex.cueEN : "",
        video: ex ? ex.video : "",
        sets: row.sets || "",
        reps: row.reps || "",
        rpe: row.rpe || "",
        tempo: row.tempo || "",
        load: row.load || "",
        rest: row.rest || "",
        note: row.note || "",
      };
      if (!daysMap.has(dayNum)) daysMap.set(dayNum, { label: dayLabel, exercises: [] });
      const d = daysMap.get(dayNum);
      if (dayLabel && !d.label) d.label = dayLabel;
      d.exercises.push(item);
    }
    return [...daysMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([dayNum, v]) => ({ label: v.label || `Day ${dayNum}`, exercises: v.exercises }));
  } catch (err) {
    console.error("buildProgramDays failed:", err.message);
    return [];
  }
}

// Map a logged-in email to a client's id (case-insensitive).
export async function findClientByEmail(email) {
  if (!hasNotion || !email) return null;
  const addr = String(email).trim().toLowerCase();
  if (!addr) return null;
  try {
    const { data, error } = await sb().from("clients").select("id,email").ilike("email", addr);
    if (error) throw error;
    const match = (data || []).find((c) => (c.email || "").toLowerCase() === addr) || (data && data[0]);
    return match ? match.id : null;
  } catch (err) {
    console.error("findClientByEmail failed:", err.message);
    return null;
  }
}

export async function getPortalData(clientId) {
  if (!hasNotion || !clientId) return { ...DEMO, demo: true };
  try {
    const { data: client, error: cErr } = await sb()
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!client) return { ...DEMO, demo: true };

    const name = client.name || "Athlete";
    const goal = client.primary_goal || "";
    const lang = normalizeLang(client.language);

    const [program, meal, , measRes] = await Promise.all([
      activeFor("programs", clientId),
      activeFor("meal_plans", clientId),
      activeFor("supplement_protocols", clientId),
      sb().from("check_ins").select("date,weight").eq("client_id", clientId).order("date", { ascending: true }),
    ]);

    let programDays = [];
    const programBlocks = []; // legacy body tables no longer exist in Postgres
    if (program) programDays = await buildProgramDays(program.id);

    // Meal/supplement DETAIL bodies were intentionally NOT migrated (shells only).
    // These get rebuilt cleanly with the nutrition & supplement features.
    const mealBlocks = [];
    const supplements = [];

    const macros = {
      kcal: meal?.calories ?? 0,
      protein: meal?.protein_g ?? 0,
      carbs: meal?.carbs_g ?? 0,
      fat: meal?.fat_g ?? 0,
    };

    const measRows = (measRes && measRes.data) || [];
    const measurements = measRows
      .map((m) => ({ date: m.date, weight: m.weight }))
      .filter((m) => m.date && m.weight != null);

    return {
      name,
      goal,
      lang,
      consentGiven: client.consent_given === true,
      weekLabel: program ? program.title : "",
      todayNote: null,
      programName: program ? program.title : "",
      programDays,
      programBlocks,
      macros,
      mealBlocks,
      supplements: supplements.length ? supplements : DEMO.supplements,
      measurements,
      weeklyTarget: null,
      demo: false,
    };
  } catch (err) {
    console.error("DB read failed, showing demo:", err.message);
    return { ...DEMO, demo: true, error: true };
  }
}

export async function getClientMeta(clientId) {
  if (!hasNotion || !clientId) return { name: "", lang: "en" };
  try {
    const { data: c, error } = await sb()
      .from("clients")
      .select("name,email,language,consent_given")
      .eq("id", clientId)
      .maybeSingle();
    if (error || !c) return { name: "", lang: "en" };
    return {
      name: c.name || "",
      email: c.email || "",
      lang: normalizeLang(c.language),
      consentGiven: c.consent_given === true,
    };
  } catch {
    return { name: "", lang: "en" };
  }
}

export async function createCheckin({ clientId, date, weight, ratings, note, photos }) {
  if (!hasNotion) throw new Error("Database not configured");
  const row = { client_id: clientId, date };
  if (weight != null && !Number.isNaN(weight)) row.weight = weight;
  const rmap = {
    energy: ratings && ratings.energy,
    strength: ratings && ratings.strength,
    sleep: ratings && ratings.sleep,
    motivation: ratings && ratings.motivation,
    digestion: ratings && ratings.digestion,
  };
  for (const [k, v] of Object.entries(rmap)) {
    if (typeof v === "number" && v >= 1 && v <= 5) row[k] = v;
  }
  if (note) row.client_note = note;
  row.photos = Array.isArray(photos) ? photos : [];

  const { data, error } = await sb().from("check_ins").insert(row).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function getCheckins(clientId) {
  if (!hasNotion || !clientId) return [];
  try {
    const { data, error } = await sb()
      .from("check_ins")
      .select("*")
      .eq("client_id", clientId)
      .order("date", { ascending: true });
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      date: r.date || "",
      weight: r.weight,
      ratings: {
        energy: r.energy,
        strength: r.strength,
        sleep: r.sleep,
        motivation: r.motivation,
        digestion: r.digestion,
      },
      note: r.client_note || "",
      feedback: r.coach_feedback || "",
      photos: Array.isArray(r.photos) ? r.photos : [],
    }));
  } catch (err) {
    console.error("getCheckins failed:", err.message);
    return [];
  }
}

// All clients, for the coach dashboard list.
// NOTE: single-coach today, so returns all. When multi-coach onboarding ships,
// this gets scoped to the current coach (coach_id = current_coach_id()).
export async function getClients() {
  if (!hasNotion) return [];
  try {
    const { data, error } = await sb()
      .from("clients")
      .select("id,name,status,email,language,primary_goal");
    if (error) throw error;
    return (data || []).map((c) => ({
      id: c.id,
      name: c.name || "(unnamed)",
      status: c.status || "",
      email: c.email || "",
      lang: normalizeLang(c.language),
      goal: c.primary_goal || "",
    }));
  } catch (err) {
    console.error("getClients failed:", err.message);
    return [];
  }
}

export async function getLatestCheckins() {
  if (!hasNotion) return {};
  try {
    const { data, error } = await sb()
      .from("check_ins")
      .select("client_id,date,weight,coach_feedback")
      .order("date", { ascending: false });
    if (error) throw error;
    const map = {};
    for (const r of data || []) {
      const cid = r.client_id;
      if (!cid) continue;
      if (!map[cid]) {
        const fb = r.coach_feedback || "";
        map[cid] = {
          date: r.date || "",
          weight: r.weight,
          count: 0,
          awaitingFeedback: !fb.trim(),
        };
      }
      map[cid].count += 1;
    }
    return map;
  } catch (err) {
    console.error("getLatestCheckins failed:", err.message);
    return {};
  }
}

export async function setCheckinFeedback(checkinId, feedback) {
  if (!hasNotion) throw new Error("Database not configured");
  const { error } = await sb()
    .from("check_ins")
    .update({ coach_feedback: feedback || null })
    .eq("id", checkinId);
  if (error) throw error;
}

export async function setClientConsent(clientId, version) {
  if (!hasNotion || !clientId) return;
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await sb()
    .from("clients")
    .update({ consent_given: true, consent_date: today, policy_version: version || null })
    .eq("id", clientId);
  if (error) throw error;
}

export async function getClientContact(clientId) {
  if (!hasNotion || !clientId) throw new Error("Database not configured");
  const { data: c, error } = await sb()
    .from("clients")
    .select("name,email")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  return { name: (c && c.name) || "", email: (c && c.email) || "" };
}

// Right to erasure. Postgres cascade deletes check-ins, programs, plans with the
// client row. This is a HARD delete (irreversible) — correct GDPR erasure
// semantics (the old Notion version archived/soft-deleted).
export async function archiveClientAndCheckins(clientId) {
  if (!hasNotion || !clientId) throw new Error("Database not configured");
  const { count } = await sb()
    .from("check_ins")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);
  const { error } = await sb().from("clients").delete().eq("id", clientId);
  if (error) throw error;
  return count || 0;
}

export async function createClientRecord({ name, email, language, goal, status }) {
  if (!hasNotion) throw new Error("Database not configured");
  // Assign to the platform-admin coach (single-coach today). Multi-coach: pass coachId.
  const { data: coach } = await sb()
    .from("coaches")
    .select("id")
    .eq("role", "platform_admin")
    .limit(1)
    .maybeSingle();
  const row = {
    name,
    status: status || "Active",
    start_date: new Date().toISOString().slice(0, 10),
    coach_id: coach ? coach.id : null,
  };
  if (email) row.email = email;
  if (language) row.language = language;
  if (goal) row.primary_goal = goal;
  const { data, error } = await sb().from("clients").insert(row).select("id").single();
  if (error) throw error;
  return data.id;
}

// ---- Plan assignment (programs / meal plans / supplement protocols) ----
const PLAN_TABLES = { program: "programs", meal: "meal_plans", supplement: "supplement_protocols" };

export async function listPlans(type, clientId) {
  const table = PLAN_TABLES[type];
  if (!hasNotion || !table) return [];
  const { data, error } = await sb().from(table).select("id,title,status,client_id");
  if (error) {
    console.error("listPlans failed:", error.message);
    return [];
  }
  return (data || [])
    .map((p) => ({
      id: p.id,
      title: p.title || "(untitled)",
      status: p.status || "",
      mine: p.client_id === clientId,
      otherClient: !!p.client_id && p.client_id !== clientId,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function assignPlan(type, planId, clientId) {
  const table = PLAN_TABLES[type];
  if (!hasNotion || !table) throw new Error("bad plan type");
  // Retire the client's other active plans of this type.
  await sb()
    .from(table)
    .update({ status: "Archived" })
    .eq("client_id", clientId)
    .eq("status", "Active")
    .neq("id", planId);
  // Bind + activate the chosen plan.
  const { error } = await sb()
    .from(table)
    .update({ client_id: clientId, status: "Active" })
    .eq("id", planId);
  if (error) throw error;
}

export async function clearActivePlan(type, clientId) {
  const table = PLAN_TABLES[type];
  if (!hasNotion || !table) throw new Error("bad plan type");
  const { data, error } = await sb()
    .from(table)
    .update({ status: "Archived" })
    .eq("client_id", clientId)
    .eq("status", "Active")
    .select("id");
  if (error) throw error;
  return (data || []).length;
}

export async function getExerciseLibraryList() {
  if (!hasNotion) return [];
  try {
    const arr = await getCachedExerciseLibrary();
    return arr
      .map((e) => ({ id: e.id, nameEN: e.nameEN || "", nameCZ: e.nameCZ || "" }))
      .sort((a, b) => (a.nameCZ || a.nameEN).localeCompare(b.nameCZ || b.nameEN, "cs"));
  } catch (err) {
    console.error("getExerciseLibraryList failed:", err.message);
    return [];
  }
}

const FOCUS_OPTS = ["Hypertrophy", "Strength", "Fat loss", "Recomp", "Conditioning"];

export async function saveProgram({ programId, title: progTitle, focus, daysPerWeek, notes, clientId, active, days }) {
  if (!hasNotion) throw new Error("Database not configured");
  const status = active && clientId ? "Active" : "Draft";
  const dw =
    daysPerWeek != null && daysPerWeek !== ""
      ? Number(daysPerWeek)
      : Array.isArray(days)
      ? days.length
      : null;

  const progRow = {
    title: (progTitle || "Untitled program").slice(0, 200),
    status,
    client_id: clientId || null,
    notes: notes || null,
    focus: FOCUS_OPTS.includes(focus) ? focus : focus || null,
    days_per_week: dw != null && !Number.isNaN(dw) ? dw : null,
  };

  let pid = programId || null;
  if (pid) {
    const { error: uErr } = await sb().from("programs").update(progRow).eq("id", pid);
    if (uErr) throw uErr;
    // Replace strategy: drop existing exercise rows for this program.
    const { error: dErr } = await sb().from("program_exercises").delete().eq("program_id", pid);
    if (dErr) throw dErr;
  } else {
    const { data, error: iErr } = await sb().from("programs").insert(progRow).select("id").single();
    if (iErr) throw iErr;
    pid = data.id;
  }

  // If this becomes the client's active program, retire their other active ones.
  if (status === "Active" && clientId) {
    await sb()
      .from("programs")
      .update({ status: "Archived" })
      .eq("client_id", clientId)
      .eq("status", "Active")
      .neq("id", pid);
  }

  // Build + insert the exercise rows (one bulk insert — no Notion throttling).
  const rows = [];
  (days || []).forEach((day, di) => {
    (day.exercises || []).forEach((exr, oi) => {
      if (!exr || !exr.exerciseId) return;
      rows.push({
        program_id: pid,
        exercise_id: exr.exerciseId,
        label: (exr.name || "Exercise").slice(0, 100),
        day: di + 1,
        sort_order: oi + 1,
        day_label: day.label || null,
        sets: exr.sets || null,
        reps: exr.reps || null,
        rpe: exr.rpe || null,
        tempo: exr.tempo || null,
        load: exr.load || null,
        rest: exr.rest || null,
        note: exr.note || null,
      });
    });
  });
  if (rows.length) {
    const { error: insErr } = await sb().from("program_exercises").insert(rows);
    if (insErr) throw insErr;
  }

  return pid;
}

export async function getProgramForEdit(programId) {
  if (!hasNotion || !programId) return null;
  try {
    const { data: p, error: pErr } = await sb().from("programs").select("*").eq("id", programId).maybeSingle();
    if (pErr) throw pErr;
    if (!p) return null;
    const { data: exRows, error: eErr } = await sb()
      .from("program_exercises")
      .select("*")
      .eq("program_id", programId)
      .order("day", { ascending: true })
      .order("sort_order", { ascending: true });
    if (eErr) throw eErr;

    const daysMap = new Map();
    for (const row of exRows || []) {
      const dayNum = row.day ?? 1;
      const dayLabel = row.day_label || "";
      const ex = {
        exerciseId: row.exercise_id || "",
        name: row.label || "",
        sets: row.sets || "",
        reps: row.reps || "",
        rpe: row.rpe || "",
        tempo: row.tempo || "",
        load: row.load || "",
        rest: row.rest || "",
        note: row.note || "",
      };
      if (!daysMap.has(dayNum)) daysMap.set(dayNum, { label: dayLabel, exercises: [] });
      const d = daysMap.get(dayNum);
      if (dayLabel && !d.label) d.label = dayLabel;
      d.exercises.push(ex);
    }
    const days = [...daysMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => ({ label: v.label || "", exercises: v.exercises }));
    return {
      title: p.title || "",
      focus: p.focus || "",
      notes: p.notes || "",
      clientId: p.client_id || "",
      active: p.status === "Active",
      days: days.length ? days : [{ label: "", exercises: [] }],
    };
  } catch (err) {
    console.error("getProgramForEdit failed:", err.message);
    return null;
  }
}
