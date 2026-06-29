import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server.js";
import { saveProgram } from "../../../../lib/notion.js";

export const maxDuration = 60;

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ADMINS.includes((user.email || "").toLowerCase()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { programId, title, focus, daysPerWeek, notes, clientId, active, days } = body || {};
  if (!title || !String(title).trim())
    return NextResponse.json({ error: "title_required" }, { status: 400 });
  const hasExercise =
    Array.isArray(days) &&
    days.some((d) => Array.isArray(d.exercises) && d.exercises.some((e) => e && e.exerciseId));
  if (!hasExercise) return NextResponse.json({ error: "no_exercises" }, { status: 400 });

  try {
    const id = await saveProgram({
      programId: programId || null,
      title: String(title).trim(),
      focus,
      daysPerWeek,
      notes,
      clientId: clientId || null,
      active: !!active,
      days,
    });
    return NextResponse.json({ ok: true, programId: id });
  } catch (err) {
    console.error("save program failed:", err.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
