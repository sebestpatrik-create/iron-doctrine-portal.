import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server.js";

// Handles the click from the sign-in email. Supports BOTH:
//  - ?code=...        (Supabase's default email link — PKCE code exchange)
//  - ?token_hash=...  (a custom email template, once you set up SMTP)
// so we can ship now on the built-in email and upgrade to SMTP later
// without changing any code.

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Coaches (admins) land on the dashboard; clients land on their portal.
// An explicit ?next= always wins (e.g. a deep link the user was sent).
async function pickLanding(supabase, explicitNext) {
  if (explicitNext) return explicitNext;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = (user?.email || "").toLowerCase();
  return ADMINS.includes(email) ? "/coach" : "/portal";
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const explicitNext = searchParams.get("next");

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${await pickLanding(supabase, explicitNext)}`);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${await pickLanding(supabase, explicitNext)}`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
