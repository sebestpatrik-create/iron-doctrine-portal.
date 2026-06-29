import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server.js";
import { getClientMeta, getCheckins, listPlans } from "../../../lib/notion.js";
import Chart from "../../../components/Chart.jsx";
import ProgressGallery from "../../../components/ProgressGallery.jsx";
import CheckinHistory from "../../../components/CheckinHistory.jsx";
import DeleteClient from "../../../components/DeleteClient.jsx";
import PlanAssign from "../../../components/PlanAssign.jsx";

export const dynamic = "force-dynamic";

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

const RATINGS = [
  ["Energy", "energy"],
  ["Strength", "strength"],
  ["Sleep", "sleep"],
  ["Motivation", "motivation"],
  ["Digestion", "digestion"],
];

export default async function CoachClient({ params }) {
  // Robust to the dynamic segment's name: use clientId, else the first route param.
  const clientId = (params && (params.clientId || Object.values(params)[0])) || "";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMINS.includes((user.email || "").toLowerCase())) redirect("/portal");

  const { name } = await getClientMeta(clientId);
  const checkins = await getCheckins(clientId); // oldest → newest

  const [progPlans, mealPlans, suppPlans] = await Promise.all([
    listPlans("program", clientId),
    listPlans("meal", clientId),
    listPlans("supplement", clientId),
  ]);
  const planSections = [
    { type: "program", plans: progPlans },
    { type: "meal", plans: mealPlans },
    { type: "supplement", plans: suppPlans },
  ];

  // Sign all photos (coach session — needs the coach read policy on the bucket).
  const paths = [];
  for (const ci of checkins) {
    for (const v of ["front", "side", "back"]) if (ci.photos[v]) paths.push(ci.photos[v]);
  }
  const signedMap = {};
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("checkins").createSignedUrls(paths, 3600);
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

  const weightSeries = checkins
    .filter((c) => c.weight != null)
    .map((c) => ({ date: c.date, weight: c.weight }));

  const history = [...checkins].reverse(); // newest first for review

  return (
    <main className="coach">
      <nav>
        <a href="/coach" className="brand">Iron <b>Doctrine</b></a>
        <div className="member">
          <span className="label">Coach</span>
          <form action="/auth/signout" method="post" style={{ margin: 0 }}>
            <button type="submit" className="nav-signout">Sign out</button>
          </form>
        </div>
      </nav>

      <section>
        <div className="wrap">
          <a href="/coach" className="coach-back">← All clients</a>
          <h1 className="coach-title">{name || "Client"}</h1>

          <PlanAssign clientId={clientId} sections={planSections} />
          <a href={`/coach/program/new?client=${clientId}`} className="coach-newprog coach-newprog-inline">+ Build a program for {name || "this client"}</a>

          <div className="coach-block">
            <div className="eyebrow">Bodyweight</div>
            <Chart measurements={weightSeries} lang="en" emptyText="No weigh-ins yet." />
          </div>

          {progress.length > 0 && (
            <div className="coach-block">
              <ProgressGallery progress={progress} lang="en" />
            </div>
          )}

          <div className="coach-block">
            <div className="eyebrow">Check-in history</div>
            <CheckinHistory history={history} />
          </div>
        </div>
      </section>

      <DeleteClient clientId={clientId} name={name} />
    </main>
  );
}
