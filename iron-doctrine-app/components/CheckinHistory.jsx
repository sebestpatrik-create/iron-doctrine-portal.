"use client";
import { useState } from "react";
import CoachFeedback from "./CoachFeedback.jsx";

const RATINGS = [
  ["Energy", "energy"],
  ["Strength", "strength"],
  ["Sleep", "sleep"],
  ["Motivation", "motivation"],
  ["Digestion", "digestion"],
];

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function CheckinDetail({ ci }) {
  const ratings = RATINGS.map(([label, key]) => [label, ci.ratings[key]]).filter(([, v]) => v != null);
  return (
    <>
      {ratings.length > 0 && (
        <div className="coach-ratings">
          {ratings.map(([k, v], j) => (
            <span className="coach-rating" key={j}><i>{k}</i>{v}/5</span>
          ))}
        </div>
      )}
      {ci.note && <div className="coach-ci-note"><i>Client note</i>{ci.note}</div>}
      <CoachFeedback checkinId={ci.id} initial={ci.feedback} />
    </>
  );
}

// Coach-side check-in history. The latest is expanded with the feedback box
// ready; older ones collapse into a compact list that opens on tap, so the
// page stays scannable even at 50+ check-ins.
export default function CheckinHistory({ history }) {
  const [openId, setOpenId] = useState(null);
  if (!history || history.length === 0) return <p className="muted">No check-ins yet.</p>;

  const [latest, ...earlier] = history;

  return (
    <div className="cih">
      <div className="cih-latest">
        <div className="cih-top">
          <span className="cih-date">{fmtDate(latest.date)}<span className="cih-tag">Latest</span></span>
          {latest.weight != null && <span className="cih-weight">{latest.weight} kg</span>}
        </div>
        <CheckinDetail ci={latest} />
      </div>

      {earlier.length > 0 && (
        <div className="cih-earlier">
          <div className="cih-earlier-h eyebrow">{`Earlier check-ins · ${earlier.length}`}</div>
          {earlier.map((ci) => {
            const open = openId === ci.id;
            return (
              <div className={"cih-item" + (open ? " open" : "")} key={ci.id}>
                <button
                  type="button"
                  className="cih-mini"
                  onClick={() => setOpenId(open ? null : ci.id)}
                  aria-expanded={open}
                >
                  <span className="cih-mini-date">{fmtDate(ci.date)}</span>
                  {ci.weight != null && <span className="cih-mini-weight">{ci.weight} kg</span>}
                  <span className={"cih-mini-fb" + (ci.feedback ? " has" : "")}>
                    {ci.feedback ? "✎ feedback" : "no feedback"}
                  </span>
                  <span className="cih-mini-chev" aria-hidden="true">⌄</span>
                </button>
                {open && <div className="cih-detail"><CheckinDetail ci={ci} /></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
