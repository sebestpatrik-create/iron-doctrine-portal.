"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Admin-only "danger zone": permanently erase a client (Supabase photos + auth
// user, Notion client row + all check-ins). Two-step, name-typed confirmation.
export default function DeleteClient({ clientId, name }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("idle"); // idle | deleting | error
  const [msg, setMsg] = useState("");

  const match = typed.trim() === (name || "").trim();

  async function del() {
    setStatus("deleting");
    setMsg("");
    try {
      const res = await fetch("/api/coach/delete-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, confirmName: typed.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMsg((data?.report?.errors || []).join(" · ") || data?.error || "Delete failed.");
        return;
      }
      router.push("/coach");
      router.refresh();
    } catch {
      setStatus("error");
      setMsg("Network error — please try again.");
    }
  }

  return (
    <section className="danger">
      <div className="danger-h">Danger zone</div>
      {!armed ? (
        <button type="button" className="danger-btn" onClick={() => setArmed(true)}>
          Delete client &amp; all data
        </button>
      ) : (
        <div className="danger-confirm">
          <p className="danger-warn">
            This permanently deletes <b>{name}</b>: their login, every progress photo, and all
            check-in records, across Supabase and Notion. This cannot be undone.
          </p>
          <label className="danger-label">
            Type <b>{name}</b> to confirm
          </label>
          <input
            className="danger-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={name}
            autoComplete="off"
          />
          <div className="danger-actions">
            <button
              type="button"
              className="danger-cancel"
              onClick={() => {
                setArmed(false);
                setTyped("");
                setStatus("idle");
                setMsg("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="danger-go"
              disabled={!match || status === "deleting"}
              onClick={del}
            >
              {status === "deleting" ? "Deleting…" : "Permanently delete"}
            </button>
          </div>
          {msg && <div className="danger-err">{msg}</div>}
        </div>
      )}
    </section>
  );
}
