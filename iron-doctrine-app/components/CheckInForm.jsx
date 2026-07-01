"use client";
import { useState } from "react";
import { createClient } from "../lib/supabase/client.js";

const MAX_PHOTOS = 10;

const DICT = {
  en: {
    weight: "Weight (kg)", ratings: "How was your week?",
    energy: "Energy", strength: "Strength", sleep: "Sleep", motivation: "Motivation", digestion: "Digestion",
    photos: "Progress photos (optional)", addPhoto: "Add",
    note: "Note for your coach", notePh: "Anything you want me to know…",
    submit: "Submit check-in", submitting: "Submitting…",
    done: "Check-in submitted", doneSub: "Nice work — see you next week.", back2: "Back to portal",
    weightReq: "Please enter your weight.", err: "Something went wrong. Please try again.",
    consent: "I consent to uploading and processing these progress photos (health data) for coaching.",
    consentReq: "Please confirm consent to upload your photos.",
  },
  cz: {
    weight: "Váha (kg)", ratings: "Jaký byl tvůj týden?",
    energy: "Energie", strength: "Síla", sleep: "Spánek", motivation: "Motivace", digestion: "Trávení",
    photos: "Fotky pokroku (nepovinné)", addPhoto: "Přidat",
    note: "Vzkaz pro trenéra", notePh: "Cokoli, co bych měl vědět…",
    submit: "Odeslat check-in", submitting: "Odesílám…",
    done: "Check-in odeslán", doneSub: "Dobrá práce — uvidíme se příští týden.", back2: "Zpět na portál",
    weightReq: "Zadej prosím svoji váhu.", err: "Něco se pokazilo. Zkus to prosím znovu.",
    consent: "Souhlasím s nahráním a zpracováním těchto fotografií progresu (údaje o zdraví) pro účely coachingu.",
    consentReq: "Pro nahrání fotek prosím potvrď souhlas.",
  },
};

const RATINGS = ["energy", "strength", "sleep", "motivation", "digestion"];

// Shrink + re-encode a phone photo before upload (EXIF-aware).
async function compress(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const max = 1280;
  let { width, height } = bitmap;
  if (width > height && width > max) { height = Math.round((height * max) / width); width = max; }
  else if (height > max) { width = Math.round((width * max) / height); height = max; }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.82));
}

export default function CheckInForm({ userId, lang }) {
  const T = DICT[lang === "cz" ? "cz" : "en"];
  const [weight, setWeight] = useState("");
  const [ratings, setRatings] = useState({});
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState([]); // array of File, up to MAX_PHOTOS
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const setRating = (k, v) => setRatings((r) => ({ ...r, [k]: r[k] === v ? undefined : v }));
  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    setPhotos((prev) => [...prev, ...incoming].slice(0, MAX_PHOTOS));
    setErrMsg("");
  };
  const removeAt = (i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  async function submit() {
    setErrMsg("");
    if (!weight) { setErrMsg(T.weightReq); return; }
    if (photos.length && !consent) { setErrMsg(T.consentReq); return; }
    setStatus("submitting");
    try {
      const supabase = createClient();
      const date = new Date().toISOString().slice(0, 10);
      const paths = [];
      for (let i = 0; i < photos.length; i++) {
        const blob = await compress(photos[i]);
        const path = `${userId}/${date}/${i + 1}.jpg`;
        const { error } = await supabase.storage
          .from("checkins")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (error) throw error;
        paths.push(path);
      }
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: Number(weight), ratings, note, photos: paths, date }),
      });
      if (!res.ok) throw new Error("save");
      setStatus("done");
    } catch (e) {
      console.error(e);
      setErrMsg(T.err);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="ci-done">
        <div className="ci-done-mark">✓</div>
        <h2>{T.done}</h2>
        <p>{T.doneSub}</p>
        <a href="/portal" className="btn btn-ghost">← {T.back2}</a>
      </div>
    );
  }

  return (
    <div className="ci">
      <label className="ci-field">
        <span className="ci-label">{T.weight}</span>
        <input type="number" inputMode="decimal" step="0.1" value={weight}
          onChange={(e) => setWeight(e.target.value)} className="ci-input" placeholder="82.5" />
      </label>

      <div className="ci-field">
        <span className="ci-label">{T.ratings}</span>
        <div className="ci-ratings">
          {RATINGS.map((k) => (
            <div className="ci-rating" key={k}>
              <span className="ci-rating-name">{T[k]}</span>
              <div className="ci-scale">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n}
                    className={"ci-dot" + (ratings[k] === n ? " on" : "")}
                    onClick={() => setRating(k, n)}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ci-field">
        <span className="ci-label">{T.photos}</span>
        <div className="ci-photos">
          {photos.map((file, i) => (
            <div className="ci-photo" key={i}>
              <img src={URL.createObjectURL(file)} alt="" />
              <button type="button" className="ci-photo-remove" aria-label="remove"
                onClick={() => removeAt(i)}>×</button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="ci-photo">
              <input type="file" accept="image/*" multiple hidden
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <span className="ci-photo-plus">+<small>{T.addPhoto}</small></span>
            </label>
          )}
        </div>
        <div className="ci-photo-count">{photos.length} / {MAX_PHOTOS}</div>
        {photos.length > 0 && (
          <label className="ci-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setErrMsg(""); }}
            />
            <span>{T.consent}</span>
          </label>
        )}
      </div>

      <label className="ci-field">
        <span className="ci-label">{T.note}</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)}
          className="ci-input ci-textarea" rows={3} placeholder={T.notePh} />
      </label>

      {errMsg && <div className="ci-err">{errMsg}</div>}

      <button type="button" className="btn btn-primary ci-submit" onClick={submit} disabled={status === "submitting"}>
        {status === "submitting" ? T.submitting : T.submit}
      </button>
    </div>
  );
}
