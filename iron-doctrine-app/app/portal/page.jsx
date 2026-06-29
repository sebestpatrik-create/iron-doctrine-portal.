import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server.js";
import { getPortalData, findClientByEmail, getCheckins } from "../../lib/notion.js";
import PortalView from "../../components/PortalView.jsx";

export const dynamic = "force-dynamic";

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
    // Admin with no client account of their own → straight to the dashboard.
    if (ADMINS.includes((user.email || "").toLowerCase())) redirect("/coach");
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

  // GDPR gate: no consent on record → must consent before using the portal.
  if (!d.demo && !d.consentGiven) redirect("/portal/consent");

  const override = searchParams?.lang;
  const lang = override === "cz" || override === "en" ? override : d.lang || "en";

  // Build the progress gallery: read check-ins, then mint short-lived signed
  // URLs for the photos (private bucket — the user can only sign their own).
  const checkins = await getCheckins(clientId);
  const paths = [];
  for (const ci of checkins) {
    for (const v of ["front", "side", "back"]) if (ci.photos[v]) paths.push(ci.photos[v]);
  }
  const signedMap = {};
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from("checkins")
      .createSignedUrls(paths, 3600);
    if (signed) for (const s of signed) if (s.signedUrl) signedMap[s.path] = s.signedUrl;
  }
  const progress = checkins
    .map((ci) => ({
      date: ci.date,
      weight: ci.weight,
      front: ci.photos.front ? signedMap[ci.photos.front] || null : null,
      side: ci.photos.side ? signedMap[ci.photos.side] || null : null,
      back: ci.photos.back ? signedMap[ci.photos.back] || null : null,
    }))
    .filter((p) => p.front || p.side || p.back);

  // All check-ins that have coach feedback, newest first → shown on the portal.
  const coachNotes = [...checkins]
    .reverse()
    .filter((c) => c.feedback)
    .map((c) => ({ text: c.feedback, date: c.date }));

  const isAdmin = ADMINS.includes((user.email || "").toLowerCase());

  return <PortalView d={d} lang={lang} progress={progress} coachNotes={coachNotes} signOut={true} isAdmin={isAdmin} />;
}
