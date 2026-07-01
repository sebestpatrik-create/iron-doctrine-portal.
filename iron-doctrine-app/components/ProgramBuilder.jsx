"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const FOCUS = ["Hypertrophy", "Strength", "Fat loss", "Recomp", "Conditioning"];
// B5 — new tempo-first set scheme (replaces sets/reps/rpe/tempo/load/rest).
const DETAILS = [
  ["workingSets", "Working sets"],
  ["reps", "Reps"],
  ["eccentric", "Eccentric"],
  ["concentric", "Concentric"],
  ["contraction", "Contraction"],
];

const emptyExercise = () => ({
  exerciseId: "", name: "",
  workingSets: "", reps: "", eccentric: "", concentric: "", contraction: "", note: "",
});
const emptyDay = () => ({ label: "", exercises: [emptyExercise()] });

// B1 — type-ahead exercise picker. Filters the library as you type; no scrolling.
function ExercisePicker({ library, valueName, onPick }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const query = q.trim().toLowerCase();
  const matches = (query
    ? library.filter(
        (l) =>
          (l.nameCZ || "").toLowerCase().includes(query) ||
          (l.nameEN || "").toLowerCase().includes(query)
      )
    : library
  ).slice(0, 8);

  return (
    <div className="pb-picker">
      <input
        className="pb-ex-select pb-ex-search"
        value={open ? q : valueName || ""}
        placeholder={valueName ? valueName : "Search exercise…"}
        onFocus={() => { setOpen(true); setQ(""); }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <ul className="pb-ex-options">
          {matches.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(l.id, l.nameCZ || l.nameEN);
                  setOpen(false);
                  setQ("");
                }}
              >
                {l.nameCZ ? <><b>{l.nameCZ}</b> <span>· {l.nameEN}</span></> : l.nameEN}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProgramBuilder({ library = [], clients = [], initial = null, programId = null }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [focus, setFocus] = useState(initial?.focus || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [clientId, setClientId] = useState(initial?.clientId || "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [days, setDays] = useState(initial?.days?.length ? initial.days : [emptyDay()]);
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState("");

  const libName = (id) => {
    const e = library.find((x) => x.id === id);
    return e ? e.nameCZ || e.nameEN : "";
  };

  const updateDay = (di, patch) => setDays((ds) => ds.map((d, i) => (i === di ? { ...d, ...patch } : d)));
  const updateExercise = (di, ei, patch) =>
    setDays((ds) =>
      ds.map((d, i) =>
        i === di ? { ...d, exercises: d.exercises.map((x, j) => (j === ei ? { ...x, ...patch } : x)) } : d
      )
    );
  const addDay = () => setDays((ds) => [...ds, emptyDay()]);
  const removeDay = (di) => setDays((ds) => (ds.length > 1 ? ds.filter((_, i) => i !== di) : ds));
  const addExercise = (di) => updateDay(di, { exercises: [...days[di].exercises, emptyExercise()] });
  const removeExercise = (di, ei) =>
    updateDay(di, { exercises: days[di].exercises.filter((_, j) => j !== ei) });
  const moveExercise = (di, ei, dir) => {
    const list = [...days[di].exercises];
    const ni = ei + dir;
    if (ni < 0 || ni >= list.length) return;
    [list[ei], list[ni]] = [list[ni], list[ei]];
    updateDay(di, { exercises: list });
  };

  async function save() {
    setErr("");
    if (!title.trim()) { setErr("Give the program a name."); return; }
    const hasEx = days.some((d) => d.exercises.some((e) => e.exerciseId));
    if (!hasEx) { setErr("Add at least one exercise."); return; }
    setStatus("saving");
    try {
      const res = await fetch("/api/coach/save-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          title: title.trim(),
          focus,
          daysPerWeek: days.length,
          notes,
          clientId: clientId || null,
          active: clientId ? active : false,
          days,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus("idle");
        setErr("Couldn't save the program — please try again.");
        return;
      }
      router.push(clientId ? `/coach/${clientId}` : "/coach");
      router.refresh();
    } catch {
      setStatus("idle");
      setErr("Network error — please try again.");
    }
  }

  return (
    <div className="pb">
      {/* meta */}
      <div className="pb-meta">
        <label className="nc-field">
          <span className="nc-label">Program name</span>
          <input className="nc-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hypertrofický plán — 4 dny" autoFocus />
        </label>
        <div className="nc-row">
          <label className="nc-field">
            <span className="nc-label">Focus</span>
            <select className="nc-input" value={focus} onChange={(e) => setFocus(e.target.value)}>
              <option value="">—</option>
              {FOCUS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label className="nc-field">
            <span className="nc-label">Assign to</span>
            <select className="nc-input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Unassigned (draft)</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {clientId && (
          <label className="pb-active">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Set as this client&apos;s active program now (retires their current one)</span>
          </label>
        )}
        <label className="nc-field">
          <span className="nc-label">Notes <i>— optional</i></span>
          <textarea className="nc-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      {/* days */}
      {days.map((day, di) => (
        <div className="pb-day" key={di}>
          <div className="pb-day-head">
            <input
              className="pb-day-label"
              value={day.label}
              onChange={(e) => updateDay(di, { label: e.target.value })}
              placeholder={`Day ${di + 1} — e.g. Push A`}
            />
            {days.length > 1 && (
              <button type="button" className="pb-x" onClick={() => removeDay(di)} title="Remove day">✕ Day</button>
            )}
          </div>

          {day.exercises.map((ex, ei) => (
            <div className="pb-ex" key={ei}>
              <div className="pb-ex-top">
                <ExercisePicker
                  library={library}
                  valueName={ex.name || libName(ex.exerciseId)}
                  onPick={(id, name) => updateExercise(di, ei, { exerciseId: id, name })}
                />
                <div className="pb-ex-tools">
                  <button type="button" onClick={() => moveExercise(di, ei, -1)} title="Move up">↑</button>
                  <button type="button" onClick={() => moveExercise(di, ei, 1)} title="Move down">↓</button>
                  <button type="button" onClick={() => removeExercise(di, ei)} title="Remove">✕</button>
                </div>
              </div>
              <div className="pb-ex-details">
                {DETAILS.map(([k, label]) => (
                  <label className="pb-d" key={k}>
                    <span>{label}</span>
                    <input value={ex[k]} onChange={(e) => updateExercise(di, ei, { [k]: e.target.value })} />
                  </label>
                ))}
                <label className="pb-d pb-d-note">
                  <span>Note</span>
                  <input value={ex.note} onChange={(e) => updateExercise(di, ei, { note: e.target.value })} />
                </label>
              </div>
            </div>
          ))}

          <button type="button" className="pb-add-ex" onClick={() => addExercise(di)}>+ Add exercise</button>
        </div>
      ))}

      <button type="button" className="pb-add-day" onClick={addDay}>+ Add day</button>

      {err && <div className="pb-err">{err}</div>}

      <div className="pb-actions">
        <a href={initial?.clientId ? `/coach/${initial.clientId}` : "/coach"} className="nc-cancel">Cancel</a>
        <button type="button" className="btn btn-primary" onClick={save} disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : programId ? "Save changes" : "Create program →"}
        </button>
      </div>
    </div>
  );
}
