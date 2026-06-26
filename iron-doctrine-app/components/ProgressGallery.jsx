"use client";
import { useState, useRef } from "react";

const DICT = {
  en: { title: "Progress", front: "Front", side: "Side", back: "Back", from: "From", to: "To",
    noPhotos: "No progress photos yet — submit a check-in with photos to start your timeline.",
    drag: "Drag the handle to compare" },
  cz: { title: "Pokrok", front: "Zepředu", side: "Z boku", back: "Zezadu", from: "Od", to: "Do",
    noPhotos: "Zatím žádné fotky — pošli check-in s fotkami a založ si svou časovou osu.",
    drag: "Táhni úchopem pro porovnání" },
};

function fmtDate(d, lang) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(lang === "cz" ? "cs-CZ" : "en-GB",
      { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
}

export default function ProgressGallery({ progress, lang }) {
  const T = DICT[lang === "cz" ? "cz" : "en"];
  const items = progress || [];
  const ref = useRef(null);
  const dragging = useRef(false);
  const [pos, setPos] = useState(50);

  const angles = ["front", "side", "back"].filter((a) => items.some((it) => it[a]));
  const [angle, setAngle] = useState(angles[0] || "front");

  const dated = items.filter((it) => it[angle]);
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

  const ai = Math.min(aIdx, dated.length - 1);
  const bi = Math.min(bIdx, dated.length - 1);
  const A = dated[ai];
  const B = dated[bi];
  const canCompare = dated.length >= 2 && A && B && A[angle] && B[angle];

  const move = (e) => {
    const rect = ref.current && ref.current.getBoundingClientRect();
    if (!rect) return;
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  };
  const onDown = (e) => { dragging.current = true; if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId); move(e); };
  const onMove = (e) => { if (dragging.current) move(e); };
  const onUp = () => { dragging.current = false; };

  const last = items[items.length - 1];
  const weightDelta = A && B && A.weight != null && B.weight != null ? B.weight - A.weight : null;

  return (
    <div className="prog">
      <h2 className="prog-title">{T.title}</h2>

      {angles.length > 1 && (
        <div className="prog-angles">
          {angles.map((a) => (
            <button key={a} type="button" className={"prog-angle" + (angle === a ? " on" : "")} onClick={() => setAngle(a)}>
              {T[a]}
            </button>
          ))}
        </div>
      )}

      {canCompare ? (
        <>
          <div className="prog-dates">
            <label className="prog-date"><span>{T.from}</span>
              <select value={ai} onChange={(e) => setAIdx(+e.target.value)}>
                {dated.map((it, i) => <option key={i} value={i}>{fmtDate(it.date, lang)}</option>)}
              </select>
            </label>
            <label className="prog-date"><span>{T.to}</span>
              <select value={bi} onChange={(e) => setBIdx(+e.target.value)}>
                {dated.map((it, i) => <option key={i} value={i}>{fmtDate(it.date, lang)}</option>)}
              </select>
            </label>
          </div>

          <div className="cmp" ref={ref} onPointerDown={onDown} onPointerMove={onMove}
            onPointerUp={onUp} onPointerLeave={onUp} onPointerCancel={onUp}>
            <img className="cmp-img" src={B[angle]} alt={fmtDate(B.date, lang)} draggable={false} />
            <img className="cmp-img cmp-top" src={A[angle]} alt={fmtDate(A.date, lang)} draggable={false}
              style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
            <div className="cmp-divider" style={{ left: `${pos}%` }}><span className="cmp-handle">⟺</span></div>
            <span className="cmp-tag cmp-l">{fmtDate(A.date, lang)}</span>
            <span className="cmp-tag cmp-r">{fmtDate(B.date, lang)}</span>
          </div>

          {weightDelta != null && (
            <div className="prog-weight">
              {A.weight} kg → {B.weight} kg
              <span className="prog-delta">{weightDelta >= 0 ? "+" : ""}{weightDelta.toFixed(1)} kg</span>
            </div>
          )}
          <p className="prog-hint">{T.drag}</p>
        </>
      ) : (
        <div className="prog-single">
          {["front", "side", "back"].map((a) => (last && last[a] ? (
            <figure key={a} className="prog-shot">
              <img src={last[a]} alt={T[a]} />
              <figcaption>{T[a]}</figcaption>
            </figure>
          ) : null))}
        </div>
      )}
    </div>
  );
}
