import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server.js";
import { getClients, getLatestCheckins } from "../../lib/notion.js";

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

const STATUS_ORDER = { Active: 0, Lead: 1, Paused: 2, Inactive: 3 };

export default async function CoachHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMINS.includes((user.email || "").toLowerCase())) redirect("/portal");

  const [clients, latest] = await Promise.all([getClients(), getLatestCheckins()]);
  clients.sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
      a.name.localeCompare(b.name)
  );

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
          <div className="coach-head">
            <div>
              <div className="eyebrow">Coach Dashboard</div>
              <h1 className="coach-title">Clients</h1>
            </div>
            <div className="coach-actions">
              <a href="/coach/program/new" className="btn btn-ghost btn-sm">+ Build a program</a>
              <a href="/coach/new" className="btn btn-primary btn-sm">+ New client</a>
            </div>
          </div>

          <div className="coach-list">
            {clients.length === 0 && <p className="muted">No clients yet.</p>}
            {clients.map((c) => {
              const ci = latest[c.id];
              return (
                <a key={c.id} href={`/coach/${c.id}`} className="coach-card">
                  <div className="coach-card-main">
                    <span className="coach-name">{c.name}</span>
                    <span className={"coach-status s-" + (c.status || "none").toLowerCase()}>
                      {c.status || "—"}
                    </span>
                  </div>
                  <div className="coach-card-meta">
                    {ci ? (
                      <>
                        Last check-in {fmtDate(ci.date)}
                        {ci.weight != null ? ` · ${ci.weight} kg` : ""}
                        {` · ${ci.count} total`}
                      </>
                    ) : (
                      "No check-ins yet"
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
