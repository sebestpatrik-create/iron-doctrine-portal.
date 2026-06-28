"use client";
import { useState } from "react";

// Editable coach-feedback box on a single check-in. Saves to Notion via the
// admin-gated route; the client sees it on their portal.
export default function CoachFeedback({ checkinId, initial }) {
  const [text, setText] = useState(initial || "");
  const [saved, setSaved] = useState(initial || "");
  const [status, setStatus] = useState("idle"); // idle | saving | done | error

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/coach/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkinId, feedback: text }),
      });
      if (!res.ok) throw new Error("save");
      setSaved(text);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
    }
  }

  const dirty = text !== saved;

  return (
    <div className="cfb">
      <span className="cfb-label">Your feedback</span>
      <textarea
        className="cfb-input"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply to this check-in…"
      />
      <div className="cfb-actions">
        <button
          type="button"
          className="btn btn-primary cfb-save"
          onClick={save}
          disabled={status === "saving" || !dirty}
        >
          {status === "saving" ? "Saving…" : status === "done" ? "Saved ✓" : "Save feedback"}
        </button>
        {status === "error" && <span className="cfb-err">Couldn't save — try again.</span>}
      </div>
    </div>
  );
}
