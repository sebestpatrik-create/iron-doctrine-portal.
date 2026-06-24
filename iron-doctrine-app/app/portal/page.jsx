import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server.js";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const supabase = createClient();
  // getUser() validates the token with Supabase — authoritative, server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="auth-wrap">
      <div className="auth-card auth-success">
        <div className="auth-logo">Iron <b>Doctrine</b></div>
        <div className="auth-eyebrow eyebrow" style={{ marginBottom: "22px" }}>
          Authenticated
        </div>
        <div className="big">You&apos;re in 🏛️</div>
        <p className="auth-sub">
          Signed in as<br />
          <b style={{ color: "var(--cream)" }}>{user.email}</b>
        </p>
        <p className="auth-note">
          The lock works. Your real portal — program, meals, progress — gets wired
          to this login next.
        </p>
        <form action="/auth/signout" method="post" style={{ marginTop: "24px" }}>
          <button
            className="auth-btn"
            type="submit"
            style={{ background: "transparent", color: "var(--gold)" }}
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
