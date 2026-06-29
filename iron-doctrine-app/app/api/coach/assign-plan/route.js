import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server.js";
import { assignPlan, clearActivePlan } from "../../../../lib/notion.js";

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const TYPES = ["program", "meal", "supplement"];

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

  const { type, planId, clientId } = body || {};
  if (!TYPES.includes(type) || !clientId)
    return NextResponse.json({ error: "bad_request" }, { status: 400 });

  try {
    if (planId === "__none__") {
      await clearActivePlan(type, clientId);
    } else if (planId) {
      await assignPlan(type, planId, clientId);
    } else {
      return NextResponse.json({ error: "no_plan" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("assign plan failed:", err.message);
    return NextResponse.json({ error: "assign_failed" }, { status: 500 });
  }
}
