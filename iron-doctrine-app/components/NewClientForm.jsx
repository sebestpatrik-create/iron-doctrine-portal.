"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const GOALS = ["Build muscle", "Lose fat", "Strength", "Recomp", "General fitness"];
const STATUSES = ["Active", "Lead", "Paused", "Inactive"];

export default function NewClientForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", language: "Czech", goal: "", status: "Active" });
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function submit() {
    setErr("");
    if (!f.name.trim()) {
      setErr("Name is required.");
      return;
    }
    setStatus("saving");
    try {
      const res = await fetch("/api/coach/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus("idle");
        setErr(
          data?.error === "bad_email"
            ? "That email looks invalid."
            : "Couldn't create the client — please try again."
        );
        return;
      }
      router.push(`/coach/${data.clientId}`);
      router.refresh();
    } catch {
      setStatus("idle");
      setErr("Network error — please try again.");
    }
  }

  return (
    <div className="nc">
      <label className="nc-field">
        <span className="nc-label">Name</span>
        <input
          className="nc-input"
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Jan Procházka"
          autoFocus
        />
      </label>

      <label className="nc-field">
        <span className="nc-label">Email <i>— their login</i></span>
        <input
          className="nc-input"
          type="email"
          value={f.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="jan@email.cz"
        />
      </label>

      <div className="nc-row">
        <label className="nc-field">
          <span className="nc-label">Language</span>
          <select className="nc-input" value={f.language} onChange={(e) => set("language", e.target.value)}>
            <option>Czech</option>
            <option>English</option>
          </select>
        </label>
        <label className="nc-field">
          <span className="nc-label">Status</span>
          <select className="nc-input" value={f.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="nc-field">
        <span className="nc-label">Primary goal</span>
        <select className="nc-input" value={f.goal} onChange={(e) => set("goal", e.target.value)}>
          <option value="">—</option>
          {GOALS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>

      {err && <div className="nc-err">{err}</div>}

      <div className="nc-actions">
        <a href="/coach" className="nc-cancel">Cancel</a>
        <button type="button" className="btn btn-primary nc-save" onClick={submit} disabled={status === "saving"}>
          {status === "saving" ? "Creating…" : "Create client →"}
        </button>
      </div>
    </div>
  );
}
