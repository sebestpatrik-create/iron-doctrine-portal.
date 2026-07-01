"use client";
import { useState } from "react";

const DICT = {
  en: { title: "Progress", from: "From", to: "To",
    noPhotos: "No progress photos yet — submit a check-in with photos to start your timeline." },
  cz: { title: "Pokrok", from: "Od", to: "Do",
    noPhotos: "Zatím žádné fotky — pošli check-in s fotkami a založ si svou časovou osu." },
};

function fmtDate(d, lang) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(lang === "cz" ? "cs-CZ" : "en-GB",
      { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
}

// Grid of a check-in's photos (any count, unnamed).
function Shots({ photos, alt }) {
  return (
    <div className="prog-shots">
      {(photos || []).map((url, i) => (
        <img key={i} src={url} alt={alt} />
      ))}
    </div>
  );
}

export default function ProgressGallery({ progress, lang }) {
  const T = DICT[lang === "cz" ? "cz" : "en"];
  // Each item: { date, weight, photos: [url, ...] }. Oldest → newest.
  const items = (progress || []).filter((it) => it.photos && it.photos.length);

  const [aIdx, setAIdx] = useState(0);
  const [bIdx, setBIdx] = useState(99);

  if (!items.length) {
    return (
      <div className="prog">
        <h2 className="prog-title">{T.title}</h2>
        <p className="prog-empty">{T.noPhotos}</p>
      </div>
    );
  }

  const canCompare = items.length >= 2;
  const ai = Math.min(aIdx, items.length - 1);
  const bi = Math.min(bIdx, items.length - 1);
  const A = items[ai];
  const B = items[bi];
  const weightDelta =
    A && B && A.weight != null && B.weight != null ? B.weight - A.weight : null;

  return (
    <div className="prog">
      <h2 className="prog-title">{T.title}</h2>

      {canCompare ? (
        <>
          <div className="prog-dates">
            <label className="prog-date"><span>{T.from}</span>
              <select value={ai} onChange={(e) => setAIdx(+e.target.value)}>
                {items.map((it, i) => <option key={i} value={i}>{fmtDate(it.date, lang)}</option>)}
              </select>
            </label>
            <label className="prog-date"><span>{T.to}</span>
              <select value={bi} onChange={(e) => setBIdx(+e.target.value)}>
                {items.map((it, i) => <option key={i} value={i}>{fmtDate(it.date, lang)}</option>)}
              </select>
            </label>
          </div>

          <div className="prog-compare">
            <figure className="prog-pane">
              <Shots photos={A.photos} alt={fmtDate(A.date, lang)} />
              <figcaption>{fmtDate(A.date, lang)}{A.weight != null ? ` \u00b7 ${A.weight} kg` : ""}</figcaption>
            </figure>
            <figure className="prog-pane">
              <Shots photos={B.photos} alt={fmtDate(B.date, lang)} />
              <figcaption>{fmtDate(B.date, lang)}{B.weight != null ? ` \u00b7 ${B.weight} kg` : ""}</figcaption>
            </figure>
          </div>

          {weightDelta != null && (
            <div className="prog-weight">
              {A.weight} kg → {B.weight} kg
              <span className="prog-delta">{weightDelta >= 0 ? "+" : ""}{weightDelta.toFixed(1)} kg</span>
            </div>
          )}
        </>
      ) : (
        <div className="prog-single">
          <Shots photos={items[items.length - 1].photos} alt={fmtDate(items[items.length - 1].date, lang)} />
        </div>
      )}
    </div>
  );
}
