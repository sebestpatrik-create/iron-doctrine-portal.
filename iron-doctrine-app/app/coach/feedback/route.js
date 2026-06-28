import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server.js";
import { setCheckinFeedback } from "../../../../lib/notion.js";

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

  const { checkinId, feedback } = body || {};
  if (!checkinId || typeof checkinId !== "string")
    return NextResponse.json({ error: "bad_request" }, { status: 400 });

  try {
    await setCheckinFeedback(checkinId, typeof feedback === "string" ? feedback.slice(0, 4000) : "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("feedback save failed:", err.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
