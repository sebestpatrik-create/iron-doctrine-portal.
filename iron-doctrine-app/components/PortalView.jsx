import Blocks from "./Blocks.jsx";
import ProgramDays from "./ProgramDays.jsx";
import Chart from "./Chart.jsx";
import { t, translateGoal } from "../lib/i18n.js";

// The full member portal UI. Used by both the logged-in /portal route and the
// /c/[id] preview link, so they never drift apart.
export default function PortalView({ d, lang, signOut }) {
  const initials = (d.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sessionForm = process.env.FORM_SESSION || "#";
  const checkinForm = process.env.FORM_CHECKIN || "#";

  const start = d.measurements && d.measurements.length ? d.measurements[0].weight : null;
  const latest = d.measurements && d.measurements.length ? d.measurements[d.measurements.length - 1].weight : null;

  return (
    <>
      {d.demo && <div className="demo-flag">{t(lang, "demoFlag")}</div>}

      <nav>
        <a href="/" className="brand">Iron <b>Doctrine</b></a>
        <div className="member">
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
        <svg className="sunburst" viewBox="0 0 100 100" aria-hidden="true">
          <g stroke="#C79A3B" fill="none">
            {Array.from({ length: 44 }).map((_, i) => {
              const a = (i / 44) * Math.PI * 2;
              return (
                <line key={i}
                  x1={(50 + Math.cos(a) * 20).toFixed(2)} y1={(50 + Math.sin(a) * 20).toFixed(2)}
                  x2={(50 + Math.cos(a) * 66).toFixed(2)} y2={(50 + Math.sin(a) * 66).toFixed(2)}
                  strokeWidth={i % 2 ? 0.25 : 0.5} />
              );
            })}
          </g>
          <circle cx="50" cy="50" r="19" stroke="#C79A3B" strokeWidth=".5" fill="none" opacity=".6" />
        </svg>
        <div className="wrap hero-inner">
          {d.weekLabel && <div className="hero-eyebrow eyebrow">{d.weekLabel}</div>}
          <h1 className="greet">{t(lang, "welcomeBack")}<br /><b>{d.name}</b></h1>
          <p className="hero-line">{t(lang, "todayDefault")}</p>
          <div className="actions">
            <a href={sessionForm} className="btn btn-primary" target="_blank" rel="noopener">{t(lang, "logSession")}</a>
            <a href="#program" className="btn btn-ghost">{t(lang, "thisWeeksPlan")}</a>
          </div>
        </div>
      </header>

      <section id="program">
        <div className="wrap">
          <div className="sec-head">
            <div><div className="eyebrow">{t(lang, "program")}</div><h2 className="sec-title">{d.programName}</h2></div>
          </div>
          {d.programDays && d.programDays.length > 0 ? (
            <ProgramDays days={d.programDays} lang={lang} />
          ) : (
            <Blocks blocks={d.programBlocks} emptyText={t(lang, "programEmpty")} />
          )}
        </div>
      </section>

      <section id="progress">
        <div className="wrap">
          <div className="sec-head"><div><div className="eyebrow">{t(lang, "progress")}</div><h2 className="sec-title">{t(lang, "theClimb")}</h2></div></div>
          <div className="prog-grid">
            <div className="chart-card">
              <h3>{t(lang, "bodyweight")}</h3>
              <Chart measurements={d.measurements} lang={lang} emptyText={t(lang, "chartEmpty")} />
            </div>
            <div className="stat-stack">
              <div className="stat"><span className="k">{t(lang, "startingWeight")}</span><span className="v">{start != null ? start : "—"}<small>kg</small></span></div>
              <div className="stat"><span className="k">{t(lang, "latest")}</span><span className="v">{latest != null ? latest : "—"}<small>kg</small></span></div>
              <div className="stat"><span className="k">{t(lang, "goal")}</span><span className="v" style={{ fontSize: "1.3rem" }}>{translateGoal(lang, d.goal) || "—"}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="nutrition">
        <div className="wrap">
          <div className="sec-head"><div><div className="eyebrow">{t(lang, "fuel")}</div><h2 className="sec-title">{t(lang, "yourPlate")}</h2></div></div>
          <div className="macros">
            <div className="macro kcal"><div className="v">{d.macros.kcal ? d.macros.kcal.toLocaleString() : "—"}</div><div className="k">{t(lang, "kcalDay")}</div></div>
            <div className="macro"><div className="v">{d.macros.protein || "—"}</div><div className="k">{t(lang, "proteinG")}</div></div>
            <div className="macro"><div className="v">{d.macros.carbs || "—"}</div><div className="k">{t(lang, "carbsG")}</div></div>
            <div className="macro"><div className="v">{d.macros.fat || "—"}</div><div className="k">{t(lang, "fatG")}</div></div>
          </div>
          {d.mealBlocks && d.mealBlocks.length > 0 && (
            <div className="meals">
              <div className="eyebrow" style={{ margin: "34px 0 6px" }}>{t(lang, "yourMeals")}</div>
              <Blocks blocks={d.mealBlocks} />
            </div>
          )}
        </div>
      </section>

      {d.supplements && d.supplements.length > 0 && (
        <section id="supps">
          <div className="wrap">
            <div className="sec-head"><div><div className="eyebrow">{t(lang, "stack")}</div><h2 className="sec-title">{t(lang, "dailySupplements")}</h2></div></div>
            <div className="supps">
              {d.supplements.map((s, i) => <div key={i} className="supp">{s}</div>)}
            </div>
          </div>
        </section>
      )}

      <section className="band">
        <div className="wrap">
          <div className="eyebrow">{t(lang, "weeklyCheckin")}</div>
          <h2 className="sec-title">{t(lang, "sendNumbers")}</h2>
          <p>{t(lang, "checkinBlurb")}</p>
          <a href="/portal/check-in" className="btn btn-primary">{t(lang, "submitCheckin")}</a>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="fmark">Iron <b>Doctrine</b></div>
          <small>{t(lang, "coachedBy")}</small>
        </div>
      </footer>
    </>
  );
}
