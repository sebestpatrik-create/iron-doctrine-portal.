import { Client } from "@notionhq/client";
import { DEMO } from "./demo.js";
import { normalizeLang } from "./i18n.js";

// Your Notion database IDs (already filled in from your workspace).
// You can override any of these with environment variables on Vercel if they ever change.
const DB = {
  clients: process.env.DB_CLIENTS || "b62535b00aff4226970e3d424383970a",
  programs: process.env.DB_PROGRAMS || "eb4e923a1d694638802ef98896fb31bb",
  meals: process.env.DB_MEALS || "3b5536e3c49241c1854dbd7ec8787ef6",
  supplements: process.env.DB_SUPPLEMENTS || "7c05a2969a6a4eb3a9bd703a0c5f950e",
  measurements: process.env.DB_MEASUREMENTS || "a2f9f4749fd3429186f5fff529701389",
  exLibrary: process.env.DB_EXLIBRARY || "d1501bd38d3d49cdab53143c3f17a676",
  progExercises: process.env.DB_PROGEXERCISES || "fb37946265404b3ba7af3defb07fb382",
  weeklyCheckin: process.env.DB_WEEKLYCHECKIN || "509f1fabd76a459399327bfa13b67cb8",
};

export const hasNotion = !!process.env.NOTION_TOKEN;

const notion = hasNotion ? new Client({ auth: process.env.NOTION_TOKEN }) : null;

// ---- tiny property readers ----
const rt = (arr) => (arr || []).map((t) => t.plain_text).join("");
const title = (p) => (p && p.title ? rt(p.title) : "");
const sel = (p) => (p && p.select ? p.select.name : "");
const num = (p) => (p && typeof p.number === "number" ? p.number : null);
const dateStart = (p) => (p && p.date ? p.date.start : null);
const urlOf = (p) => (p && p.url ? p.url : "");
const relIds = (p) => (p && p.relation ? p.relation.map((r) => r.id) : []);

// ---- turn Notion page blocks into a simple shape the UI can render ----
async function normalizeBlocks(pageId) {
  const out = [];
  const res = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
  for (const b of res.results) {
    const t = b.type;
    if (t === "heading_1" || t === "heading_2") out.push({ type: "h2", text: rt(b[t].rich_text) });
    else if (t === "heading_3") out.push({ type: "h3", text: rt(b[t].rich_text) });
    else if (t === "paragraph") { const x = rt(b.paragraph.rich_text); if (x.trim()) out.push({ type: "p", text: x }); }
    else if (t === "bulleted_list_item") out.push({ type: "li", text: rt(b.bulleted_list_item.rich_text) });
    else if (t === "numbered_list_item") out.push({ type: "li", text: rt(b.numbered_list_item.rich_text) });
    else if (t === "quote") out.push({ type: "quote", text: rt(b.quote.rich_text) });
    else if (t === "divider") out.push({ type: "divider" });
    else if (t === "table") {
      const rows = await notion.blocks.children.list({ block_id: b.id, page_size: 100 });
      const cells = rows.results
        .filter((r) => r.type === "table_row")
        .map((r) => r.table_row.cells.map((c) => rt(c)));
      const header = b.table.has_column_header && cells.length ? cells.shift() : null;
      out.push({ type: "table", header, rows: cells });
    }
  }
  return out;
}

// Find the active record in a database that is linked to this client.
async function activeFor(databaseId, clientId) {
  const res = await notion.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        { property: "Client", relation: { contains: clientId } },
        { property: "Status", select: { equals: "Active" } },
      ],
    },
    page_size: 1,
  });
  return res.results[0] || null;
}

// Map a logged-in email to a client's Notion page id (case-insensitive).
export async function findClientByEmail(email) {
  if (!hasNotion || !email) return null;
  const addr = String(email).trim().toLowerCase();
  if (!addr) return null;
  try {
    const res = await notion.databases.query({
      database_id: DB.clients,
      filter: { property: "Email", email: { equals: addr } },
      page_size: 5,
    });
    let match = res.results[0];
    if (!match) {
      // Fallback: case-insensitive scan in case the stored email differs in case.
      const all = await notion.databases.query({
        database_id: DB.clients,
        page_size: 100,
      });
      match = all.results.find((p) => {
        const e = p.properties && p.properties.Email && p.properties.Email.email;
        return e && e.toLowerCase() === addr;
      });
    }
    return match ? match.id : null;
  } catch (err) {
    console.error("findClientByEmail failed:", err.message);
    return null;
  }
}

// Load the whole Exercise Library once into a map: pageId -> exercise info.
// Resolving relations in memory keeps the portal fast (no per-exercise fetch).
async function loadExerciseLibrary() {
  const map = new Map();
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id: DB.exLibrary,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const p of res.results) {
      const pr = p.properties;
      map.set(p.id, {
        nameEN: title(pr["Name"]),
        nameCZ: rt(pr["Název CZ"] && pr["Název CZ"].rich_text),
        cueEN: rt(pr["Cue EN"] && pr["Cue EN"].rich_text),
        cueCZ: rt(pr["Cue CZ"] && pr["Cue CZ"].rich_text),
        video: urlOf(pr["Video"]),
      });
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return map;
}

// Assemble a program's days from the Program Exercises rows, each resolved
// against the Library. Returns [] if the program has no relational rows yet
// (so the caller can fall back to the old body-table rendering).
async function buildProgramDays(programId) {
  try {
    const res = await notion.databases.query({
      database_id: DB.progExercises,
      filter: { property: "Program", relation: { contains: programId } },
      sorts: [
        { property: "Day", direction: "ascending" },
        { property: "Order", direction: "ascending" },
      ],
      page_size: 100,
    });
    if (!res.results.length) return [];

    const lib = await loadExerciseLibrary();
    const daysMap = new Map();
    for (const row of res.results) {
      const pr = row.properties;
      const dayNum = num(pr["Day"]) ?? 0;
      const dayLabel = rt(pr["Day Label"] && pr["Day Label"].rich_text);
      const ex = lib.get(relIds(pr["Exercise"])[0]) || null;
      const fallbackName = title(pr["Label"]);
      const item = {
        nameEN: ex ? ex.nameEN : fallbackName,
        nameCZ: ex ? ex.nameCZ || ex.nameEN : fallbackName,
        cueEN: ex ? ex.cueEN : "",
        cueCZ: ex ? ex.cueCZ || ex.cueEN : "",
        video: ex ? ex.video : "",
        sets: rt(pr["Sets"] && pr["Sets"].rich_text),
        reps: rt(pr["Reps"] && pr["Reps"].rich_text),
        rpe: rt(pr["RPE"] && pr["RPE"].rich_text),
        tempo: rt(pr["Tempo"] && pr["Tempo"].rich_text),
        load: rt(pr["Load"] && pr["Load"].rich_text),
        rest: rt(pr["Rest"] && pr["Rest"].rich_text),
        note: rt(pr["Note"] && pr["Note"].rich_text),
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
    console.error("buildProgramDays failed, falling back to body:", err.message);
    return [];
  }
}

export async function getPortalData(clientId) {
  // No token yet, or no id → show the demo so the page always renders.
  if (!hasNotion || !clientId) return { ...DEMO, demo: true };

  try {
    const client = await notion.pages.retrieve({ page_id: clientId });
    const cp = client.properties;
    const name = title(cp["Name"]) || "Athlete";
    const goal = sel(cp["Primary Goal"]) || "";
    const lang = normalizeLang(sel(cp["Language"]) || sel(cp["Select"]));

    const [program, meal, supp, measRes] = await Promise.all([
      activeFor(DB.programs, clientId),
      activeFor(DB.meals, clientId),
      activeFor(DB.supplements, clientId),
      notion.databases.query({
        database_id: DB.measurements,
        filter: { property: "Client", relation: { contains: clientId } },
        sorts: [{ property: "Date", direction: "ascending" }],
        page_size: 100,
      }),
    ]);

    let programDays = [];
    let programBlocks = [];
    if (program) {
      programDays = await buildProgramDays(program.id);
      // Legacy programs authored as body tables still render via the fallback.
      if (!programDays.length) programBlocks = await normalizeBlocks(program.id);
    }
    const mealBlocks = meal ? await normalizeBlocks(meal.id) : [];
    const suppBlocks = supp ? await normalizeBlocks(supp.id) : [];
    const supplements = suppBlocks
      .filter((b) => b.type === "li")
      .map((b) => b.text.replace(/\*\*/g, ""))
      .filter(Boolean);

    const mp = meal ? meal.properties : {};
    const macros = {
      kcal: num(mp["Calories (kcal)"]) ?? 0,
      protein: num(mp["Protein (g)"]) ?? 0,
      carbs: num(mp["Carbs (g)"]) ?? 0,
      fat: num(mp["Fat (g)"]) ?? 0,
    };

    const measurements = measRes.results
      .map((m) => ({ date: dateStart(m.properties["Date"]), weight: num(m.properties["Weight (kg)"]) }))
      .filter((m) => m.date && m.weight != null);

    return {
      name,
      goal,
      lang,
      weekLabel: program ? title(program.properties["Program"]) : "",
      todayNote: null,
      programName: program ? title(program.properties["Program"]) : "",
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
    console.error("Notion read failed, showing demo:", err.message);
    return { ...DEMO, demo: true, error: true };
  }
}

// Lightweight client metadata (name + language) without the full portal read.
export async function getClientMeta(clientId) {
  if (!hasNotion || !clientId) return { name: "", lang: "en" };
  try {
    const client = await notion.pages.retrieve({ page_id: clientId });
    const cp = client.properties;
    return {
      name: title(cp["Name"]) || "",
      lang: normalizeLang(sel(cp["Language"]) || sel(cp["Select"])),
    };
  } catch {
    return { name: "", lang: "en" };
  }
}

// Create a Weekly Check-in row for a client. Photo values are Supabase
// Storage *paths* (not public URLs) — the images stay private in the bucket.
export async function createCheckin({ clientId, date, weight, ratings, note, photos }) {
  if (!hasNotion) throw new Error("Notion not configured");
  const props = {
    "Check-in": { title: [{ text: { content: date } }] },
    Client: { relation: [{ id: clientId }] },
    Date: { date: { start: date } },
  };
  if (weight != null && !Number.isNaN(weight)) props["Weight"] = { number: weight };
  const ratingMap = {
    Energy: ratings && ratings.energy,
    Strength: ratings && ratings.strength,
    Sleep: ratings && ratings.sleep,
    Motivation: ratings && ratings.motivation,
    Digestion: ratings && ratings.digestion,
  };
  for (const [k, v] of Object.entries(ratingMap)) {
    if (typeof v === "number" && v >= 1 && v <= 5) props[k] = { number: v };
  }
  if (note) props["Client Note"] = { rich_text: [{ text: { content: note } }] };
  if (photos && photos.front) props["Photo Front"] = { rich_text: [{ text: { content: photos.front } }] };
  if (photos && photos.side) props["Photo Side"] = { rich_text: [{ text: { content: photos.side } }] };
  if (photos && photos.back) props["Photo Back"] = { rich_text: [{ text: { content: photos.back } }] };

  const res = await notion.pages.create({
    parent: { database_id: DB.weeklyCheckin },
    properties: props,
  });
  return res.id;
}

// All check-ins for a client, oldest → newest. Photo fields hold Storage
// paths; the caller mints signed URLs (the bucket is private).
export async function getCheckins(clientId) {
  if (!hasNotion || !clientId) return [];
  try {
    const res = await notion.databases.query({
      database_id: DB.weeklyCheckin,
      filter: { property: "Client", relation: { contains: clientId } },
      sorts: [{ property: "Date", direction: "ascending" }],
      page_size: 100,
    });
    return res.results.map((row) => {
      const pr = row.properties;
      return {
        date: dateStart(pr["Date"]) || "",
        weight: num(pr["Weight"]),
        ratings: {
          energy: num(pr["Energy"]),
          strength: num(pr["Strength"]),
          sleep: num(pr["Sleep"]),
          motivation: num(pr["Motivation"]),
          digestion: num(pr["Digestion"]),
        },
        note: rt(pr["Client Note"] && pr["Client Note"].rich_text),
        feedback: rt(pr["Coach Feedback"] && pr["Coach Feedback"].rich_text),
        photos: {
          front: rt(pr["Photo Front"] && pr["Photo Front"].rich_text),
          side: rt(pr["Photo Side"] && pr["Photo Side"].rich_text),
          back: rt(pr["Photo Back"] && pr["Photo Back"].rich_text),
        },
      };
    });
  } catch (err) {
    console.error("getCheckins failed:", err.message);
    return [];
  }
}

// All clients, for the coach dashboard list.
export async function getClients() {
  if (!hasNotion) return [];
  try {
    const res = await notion.databases.query({ database_id: DB.clients, page_size: 100 });
    return res.results.map((row) => {
      const pr = row.properties;
      return {
        id: row.id,
        name: title(pr["Name"]) || "(unnamed)",
        status: sel(pr["Status"]) || "",
        email: (pr["Email"] && pr["Email"].email) || "",
        lang: normalizeLang(sel(pr["Language"])),
        goal: sel(pr["Primary Goal"]) || "",
      };
    });
  } catch (err) {
    console.error("getClients failed:", err.message);
    return [];
  }
}

// Per-client latest check-in summary (date, weight, total count) for the list.
export async function getLatestCheckins() {
  if (!hasNotion) return {};
  try {
    const res = await notion.databases.query({
      database_id: DB.weeklyCheckin,
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: 100,
    });
    const map = {};
    for (const row of res.results) {
      const pr = row.properties;
      const rel = pr["Client"] && pr["Client"].relation;
      const cid = rel && rel[0] && rel[0].id;
      if (!cid) continue;
      if (!map[cid]) map[cid] = { date: dateStart(pr["Date"]) || "", weight: num(pr["Weight"]), count: 0 };
      map[cid].count += 1;
    }
    return map;
  } catch (err) {
    console.error("getLatestCheckins failed:", err.message);
    return {};
  }
}
