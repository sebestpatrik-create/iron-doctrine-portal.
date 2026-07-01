import Blocks from "./Blocks.jsx";
import ProgramDays from "./ProgramDays.jsx";
import ProgressGallery from "./ProgressGallery.jsx";
import Collapsible from "./Collapsible.jsx";
import Chart from "./Chart.jsx";
import { t, translateGoal } from "../lib/i18n.js";

// The full member portal UI. Used by both the logged-in /portal route and the
// /c/[id] preview link, so they never drift apart. Ledger layout: a contained
// two-column shell on desktop (program main + at-a-glance rail), clean single
// column on phone.
export default function PortalView({ d, lang, signOut, progress, coachNotes, isAdmin }) {
  const initials = (d.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const fmtCheckin = (ds) => {
    try {
      return new Date(ds).toLocaleDateString(lang === "cz" ? "cs-CZ" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return ds;
    }
  };
  const notes = Array.isArray(coachNotes) ? coachNotes.filter((n) => n && n.text) : [];
  const start = d.measurements && d.measurements.length ? d.measurements[0].weight : null;
  const latest = d.measurements && d.measurements.length ? d.measurements[d.measurements.length - 1].weight : null;
  const hasPhotos = progress && progress.length > 0;
  const hasSupps = d.supplements && d.supplements.length > 0;

  return (
    <>
      {d.demo && <div className="demo-flag">{t(lang, "demoFlag")}</div>}

      <nav>
        <a href="/" className="brand">
          <img src="/mark.png" alt="" className="brand-mark" aria-hidden="true" />
          <span>Iron <b>Doctrine</b></span>
        </a>
        <div className="member">
          {isAdmin && <a href="/coach" className="nav-coach">Coach</a>}
          <span className="label">{t(lang, "member")}</span>
          <div className="avatar">{initials}</div>
          {signOut && (
            <form action="/auth/signout" method="post" style={{ margin: 0 }}>
              <button type="submit" className="nav-signout">{t(lang, "signOut")}</button>
            </form>
          )}
        </div>
      </nav>

      <header className="hero">
        <img src="/badge.png" alt="" className="hero-badge" aria-hidden="true" />
        <div className="wrap hero-inner">
          {d.weekLabel && <div className="hero-eyebrow eyebrow">{d.weekLabel}</div>}
          <h1 className="greet">{t(lang, "welcome")}<br /><b>{d.name}</b></h1>
          <p className="hero-line">{t(lang, "todayDefault")}</p>
          <div className="actions">
            <a href="/portal/check-in" className="btn btn-primary">{t(lang, "submitCheckin")}</a>
            <a href="#program" className="btn btn-ghost">{t(lang, "thisWeeksPlan")}</a>
          </div>
        </div>
      </header>

      <div className="portal">
        <div className="wrap">
          <div className="portal-grid">

            {/* ---- MAIN: coach note + program ---- */}
            <main className="col-main">
              {notes.length > 0 && (
                <div className="p-coachwrap">
                  <div className="coachnote">
                    <div className="eyebrow">{lang === "cz" ? "Zpráva od trenéra" : "Message from your coach"}</div>
                    <p className="coachnote-text">{notes[0].text}</p>
                    {notes[0].date && (
                      <div className="coachnote-date">
                        {lang === "cz" ? "k check-inu " : "re: check-in "}
                        {fmtCheckin(notes[0].date)}
                      </div>
                    )}
                  </div>
                  {notes.length > 1 && (
                    <div className="coachnote-prev">
                      <Collapsible
                        eyebrow={lang === "cz" ? "Archiv" : "Archive"}
                        title={lang === "cz" ? `Předchozí zprávy (${notes.length - 1})` : `Previous messages (${notes.length - 1})`}
                      >
                        {notes.slice(1).map((n, i) => (
                          <div className="coachnote coachnote-old" key={i}>
                            <p className="coachnote-text">{n.text}</p>
                            {n.date && (
                              <div className="coachnote-date">
                                {lang === "cz" ? "k check-inu " : "re: check-in "}
                                {fmtCheckin(n.date)}
                              </div>
                            )}
                          </div>
                        ))}
                      </Collapsible>
                    </div>
                  )}
                </div>
              )}

              <div className="p-card p-program" id="program">
                <Collapsible eyebrow={t(lang, "program")} title={d.programName} defaultOpen={true}>
                  {d.programDays && d.programDays.length > 0 ? (
                    <ProgramDays days={d.programDays} lang={lang} />
                  ) : (
                    <Blocks blocks={d.programBlocks} emptyText={t(lang, "programEmpty")} />
                  )}
                </Collapsible>
              </div>
            </main>

            {/* ---- RAIL: at-a-glance ---- */}
            <aside className="col-rail">
              <div className="p-card rail-card">
                <div className="eyebrow">{t(lang, "progress")}</div>
                <h3 className="rail-title">{t(lang, "theClimb")}</h3>
                <Chart measurements={d.measurements} lang={lang} emptyText={t(lang, "chartEmpty")} />
                <div className="rail-stats">
                  <div className="rstat"><span className="k">{t(lang, "startingWeight")}</span><span className="v">{start != null ? start : "—"}<small>kg</small></span></div>
                  <div className="rstat"><span className="k">{t(lang, "latest")}</span><span className="v">{latest != null ? latest : "—"}<small>kg</small></span></div>
                </div>
                <div className="rail-goal"><span className="k">{t(lang, "goal")}</span><span className="gv">{translateGoal(lang, d.goal) || "—"}</span></div>
              </div>

              <div className="p-card rail-card">
                <div className="eyebrow">{t(lang, "fuel")}</div>
                <h3 className="rail-title">{t(lang, "yourPlate")}</h3>
                <div className="macros">
                  <div className="macro kcal"><div className="v">{d.macros.kcal ? d.macros.kcal.toLocaleString() : "—"}</div><div className="k">{t(lang, "kcalDay")}</div></div>
                  <div className="macro"><div className="v">{d.macros.protein || "—"}</div><div className="k">{t(lang, "proteinG")}</div></div>
                  <div className="macro"><div className="v">{d.macros.carbs || "—"}</div><div className="k">{t(lang, "carbsG")}</div></div>
                  <div className="macro"><div className="v">{d.macros.fat || "—"}</div><div className="k">{t(lang, "fatG")}</div></div>
                </div>
                {d.mealBlocks && d.mealBlocks.length > 0 && (
                  <div className="rail-meals">
                    <Collapsible eyebrow="" title={t(lang, "yourMeals")}>
                      <Blocks blocks={d.mealBlocks} />
                    </Collapsible>
                  </div>
                )}
              </div>

              {hasSupps && (
                <div className="p-card rail-card">
                  <div className="eyebrow">{t(lang, "stack")}</div>
                  <h3 className="rail-title">{t(lang, "dailySupplements")}</h3>
                  <div className="supps">
                    {d.supplements.map((s, i) => <div key={i} className="supp">{s}</div>)}
                  </div>
                </div>
              )}
            </aside>

          </div>

          {hasPhotos && (
            <div className="p-card portal-full" id="photos">
              <ProgressGallery progress={progress} lang={lang} />
            </div>
          )}

          <div className="checkin-band">
            <div className="cb-copy">
              <div className="eyebrow">{t(lang, "weeklyCheckin")}</div>
              <h2>{t(lang, "sendNumbers")}</h2>
              <p>{t(lang, "checkinBlurb")}</p>
            </div>
            <a href="/portal/check-in" className="btn btn-primary">{t(lang, "submitCheckin")}</a>
          </div>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <div className="fmark">Iron <b>Doctrine</b></div>
          <small>{t(lang, "coachedBy")}</small>
          <a href={`/privacy?lang=${lang === "cz" ? "cs" : "en"}`} className="footer-privacy">{t(lang, "privacyLink")}</a>
        </div>
      </footer>
    </>
  );
}
