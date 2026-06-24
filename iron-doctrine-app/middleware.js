import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Keeps the auth session fresh on every request by rotating tokens in cookies.
// IMPORTANT: this does NOT make access decisions. Route protection happens
// server-side inside each protected page (see app/portal/page.jsx), because
// middleware-only auth is bypassable (CVE-2025-29927).
export async function middleware(request) {
  // If Supabase isn't configured yet, do nothing — the site stays up.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touch the session so expired tokens get refreshed into the response cookies.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
