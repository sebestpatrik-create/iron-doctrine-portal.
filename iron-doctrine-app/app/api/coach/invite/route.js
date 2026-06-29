import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server.js";
import { createAdminClient, findAuthUserByEmail } from "../../../../lib/supabase/admin.js";
import { getClientMeta } from "../../../../lib/notion.js";
import { sendInviteEmail, emailConfigured } from "../../../../lib/email.js";

export const maxDuration = 30;

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

  if (!emailConfigured())
    return NextResponse.json({ error: "email_not_configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const clientId = (body?.clientId || "").trim();
  if (!clientId) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  // Resolve the recipient + their language from Notion.
  const meta = await getClientMeta(clientId);
  const email = (meta.email || "").trim();
  if (!email) return NextResponse.json({ error: "no_email" }, { status: 400 });

  // Build the public origin for links (the coach's same-origin request carries it).
  const headerOrigin = request.headers.get("origin");
  const origin =
    (headerOrigin && /^https?:\/\//.test(headerOrigin) && headerOrigin) ||
    (typeof body?.origin === "string" && /^https?:\/\//.test(body.origin) && body.origin) ||
    new URL(request.url).origin;

  try {
    const admin = createAdminClient();

    // Ensure the auth user exists (a brand-new client won't have one yet).
    const existing = await findAuthUserByEmail(admin, email);
    if (!existing) {
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      // If two invites race, the user may already exist — that's fine.
      if (createErr && !/already/i.test(createErr.message || "")) throw createErr;
    }

    // Mint a magic-link token without sending Supabase's own email.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${origin}/auth/confirm` },
    });
    if (linkErr) throw linkErr;

    const hashed = linkData?.properties?.hashed_token;
    if (!hashed) throw new Error("no token from generateLink");

    const link = `${origin}/auth/confirm?token_hash=${encodeURIComponent(hashed)}&type=magiclink`;

    await sendInviteEmail({ to: email, name: meta.name, link, lang: meta.lang, origin });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("invite failed:", err.message);
    return NextResponse.json({ error: "invite_failed" }, { status: 500 });
  }
}
