"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const LABELS = { program: "Training program", meal: "Meal plan", supplement: "Supplements" };

export default function PlanAssign({ clientId, sections }) {
  const router = useRouter();
  return (
    <section className="pa">
      <div className="pa-h">Plans</div>
      <div className="pa-grid">
        {sections.map((s) => (
          <PlanRow
            key={s.type}
            clientId={clientId}
            type={s.type}
            label={LABELS[s.type]}
            plans={s.plans}
            onDone={() => router.refresh()}
          />
        ))}
      </div>
    </section>
  );
}

function PlanRow({ clientId, type, label, plans, onDone }) {
  const current = plans.find((p) => p.mine && p.status === "Active");
  const [choice, setChoice] = useState(current?.id || "");
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState("");

  async function post(planId) {
    setStatus("saving");
    setErr("");
    try {
      const res = await fetch("/api/coach/assign-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, planId, clientId }),
      });
      if (!res.ok) throw new Error();
      setStatus("idle");
      onDone();
    } catch {
      setStatus("idle");
      setErr("Failed — please try again.");
    }
  }

  return (
    <div className="pa-row">
      <div className="pa-top">
        <span className="pa-label">{label}</span>
        <span className="pa-current">
          {current ? current.title : <span className="pa-none">None assigned</span>}
          {type === "program" && current && (
            <a href={`/coach/program/${current.id}/edit`} className="pa-edit">Edit</a>
          )}
        </span>
      </div>
      <div className="pa-controls">
        <select className="pa-select" value={choice} onChange={(e) => setChoice(e.target.value)}>
          <option value="">Select a plan…</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
              {p.status && p.status !== "Active" ? ` · ${p.status}` : ""}
              {p.otherClient ? " · assigned elsewhere" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary pa-btn"
          disabled={!choice || choice === current?.id || status === "saving"}
          onClick={() => post(choice)}
        >
          {status === "saving" ? "…" : "Assign"}
        </button>
        {current && (
          <button type="button" className="pa-unassign" disabled={status === "saving"} onClick={() => post("__none__")}>
            Unassign
          </button>
        )}
      </div>
      {err && <div className="pa-err">{err}</div>}
    </div>
  );
}
