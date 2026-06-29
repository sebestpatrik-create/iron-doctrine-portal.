import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server.js";
import { createClientRecord } from "../../../../lib/notion.js";

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const LANGS = ["Czech", "English"];
const GOALS = ["Build muscle", "Lose fat", "Strength", "Recomp", "General fitness"];
const STATUSES = ["Active", "Lead", "Paused", "Inactive"];

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

  const name = (body?.name || "").trim();
  const email = (body?.email || "").trim();
  const language = LANGS.includes(body?.language) ? body.language : "Czech";
  const goal = GOALS.includes(body?.goal) ? body.goal : "";
  const status = STATUSES.includes(body?.status) ? body.status : "Active";

  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "bad_email" }, { status: 400 });

  try {
    const clientId = await createClientRecord({ name, email, language, goal, status });
    return NextResponse.json({ ok: true, clientId });
  } catch (err) {
    console.error("create client failed:", err.message);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
