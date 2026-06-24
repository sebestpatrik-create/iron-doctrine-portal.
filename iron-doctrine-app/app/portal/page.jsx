import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server.js";
import { getPortalData, findClientByEmail } from "../../lib/notion.js";
import PortalView from "../../components/PortalView.jsx";

export const dynamic = "force-dynamic";

export default async function PortalPage({ searchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → bounce to login.
  if (!user) redirect("/login");

  // Logged in → match the verified email to a Notion client.
  const clientId = await findClientByEmail(user.email);

  if (!clientId) {
    // Authenticated, but no client registered under this email.
    return (
      <main className="auth-wrap">
        <div className="auth-card auth-success">
          <div className="auth-logo">Iron <b>Doctrine</b></div>
          <div className="auth-eyebrow eyebrow" style={{ marginBottom: "22px" }}>
            No portal found
          </div>
          <p className="auth-sub">
            You&apos;re signed in as<br />
            <b style={{ color: "var(--cream)" }}>{user.email}</b>,<br />
            but no client is registered under this email yet.
          </p>
          <p className="auth-note">
            If you&apos;re an Iron Doctrine client, check that this is the email your
            coach has on file, then sign in again.
          </p>
          <form action="/auth/signout" method="post" style={{ marginTop: "22px" }}>
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

  const d = await getPortalData(clientId);
  const override = searchParams?.lang;
  const lang = override === "cz" || override === "en" ? override : d.lang || "en";

  return <PortalView d={d} lang={lang} signOut={true} />;
}
