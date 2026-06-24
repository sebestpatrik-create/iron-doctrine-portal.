import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server.js";

// Handles the click from the sign-in email. Supports BOTH:
//  - ?code=...        (Supabase's default email link — PKCE code exchange)
//  - ?token_hash=...  (a custom email template, once you set up SMTP)
// so we can ship now on the built-in email and upgrade to SMTP later
// without changing any code.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/portal";

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
