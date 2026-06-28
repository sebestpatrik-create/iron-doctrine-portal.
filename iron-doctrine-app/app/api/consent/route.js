import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server.js";
import { findClientByEmail, setClientConsent } from "../../../lib/notion.js";
import { POLICY_VERSION } from "../../../lib/legal.js";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const clientId = await findClientByEmail(user.email);
  if (!clientId) return NextResponse.json({ error: "no_client" }, { status: 404 });

  try {
    await setClientConsent(clientId, POLICY_VERSION);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("consent save failed:", err.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
