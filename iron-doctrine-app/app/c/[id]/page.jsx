import { getPortalData } from "../../../lib/notion.js";
import Blocks from "../../../components/Blocks.jsx";
import Chart from "../../../components/Chart.jsx";

// Always read fresh from Notion so edits show up live.
export const dynamic = "force-dynamic";

export default async function Portal({ params }) {
  const d = await getPortalData(params.id);

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
      {d.demo && <div className="demo-flag">Demo data — connect Notion to show live client data</div>}

      <nav>
        <a href="/" className="brand">Iron <b>Doctrine</b></a>
        <div className="member">
          <span className="label">Member</span>
          <div className="avatar">{initials}</div>
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
          <h1 className="greet">Welcome back,<br /><b>{d.name}</b></h1>
          <p className="hero-line">{d.todayNote}</p>
          <div className="actions">
            <a href={sessionForm} className="btn btn-primary" target="_blank" rel="noopener">Log today&apos;s session →</a>
            <a href="#program" className="btn btn-ghost">This week&apos;s plan</a>
          </div>
        </div>
      </header>

      <section id="program">
        <div className="wrap">
          <div className="sec-head">
            <div><div className="eyebrow">Your program</div><h2 className="sec-title">{d.programName}</h2></div>
          </div>
          <Blocks blocks={d.programBlocks} />
        </div>
      </section>

      <section id="progress">
        <div className="wrap">
          <div className="sec-head"><div><div className="eyebrow">Progress</div><h2 className="sec-title">The Climb</h2></div></div>
          <div className="prog-grid">
            <div className="chart-card">
              <h3>Bodyweight over time</h3>
              <Chart measurements={d.measurements} />
            </div>
            <div className="stat-stack">
              <div className="stat"><span className="k">Starting weight</span><span className="v">{start != null ? start : "—"}<small>kg</small></span></div>
              <div className="stat"><span className="k">Latest</span><span className="v">{latest != null ? latest : "—"}<small>kg</small></span></div>
              <div className="stat"><span className="k">Goal</span><span className="v" style={{ fontSize: "1.3rem" }}>{d.goal || "—"}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="nutrition">
        <div className="wrap">
          <div className="sec-head"><div><div className="eyebrow">Fuel</div><h2 className="sec-title">Your Plate</h2></div></div>
          <div className="macros">
            <div className="macro kcal"><div className="v">{d.macros.kcal ? d.macros.kcal.toLocaleString() : "—"}</div><div className="k">kcal / day</div></div>
            <div className="macro"><div className="v">{d.macros.protein || "—"}</div><div className="k">protein (g)</div></div>
            <div className="macro"><div className="v">{d.macros.carbs || "—"}</div><div className="k">carbs (g)</div></div>
            <div className="macro"><div className="v">{d.macros.fat || "—"}</div><div className="k">fat (g)</div></div>
          </div>
          {d.mealBlocks && d.mealBlocks.length > 0 && (
            <div className="meals">
              <div className="eyebrow" style={{ margin: "34px 0 6px" }}>Your meals</div>
              <Blocks blocks={d.mealBlocks} />
            </div>
          )}
        </div>
      </section>

      {d.supplements && d.supplements.length > 0 && (
        <section id="supps">
          <div className="wrap">
            <div className="sec-head"><div><div className="eyebrow">Stack</div><h2 className="sec-title">Daily Supplements</h2></div></div>
            <div className="supps">
              {d.supplements.map((s, i) => <div key={i} className="supp">{s}</div>)}
            </div>
          </div>
        </section>
      )}

      <section className="band">
        <div className="wrap">
          <div className="eyebrow">Weekly check-in</div>
          <h2 className="sec-title">Send your numbers</h2>
          <p>Weigh in first thing, log your measurements, and watch the climb. One minute a week is the whole job.</p>
          <a href={checkinForm} className="btn btn-primary" target="_blank" rel="noopener">Submit check-in →</a>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="fmark">Iron <b>Doctrine</b></div>
          <small>Coached by Bc. Patrik Šebest · Praha</small>
        </div>
      </footer>
    </>
  );
}
