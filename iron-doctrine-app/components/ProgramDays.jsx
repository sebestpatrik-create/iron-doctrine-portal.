// Renders a program assembled from the relational Program Exercises rows.
// Each exercise is a card: name (+ optional video link), the prescription
// stats, and the form cue inherited from the Exercise Library — in the
// client's language. Falls back to nothing when there are no days (the
// caller then renders the legacy body-table program instead).
export default function ProgramDays({ days, lang }) {
  if (!days || !days.length) return null;
  const cz = lang === "cz";
  const L = {
    workingSets: cz ? "Pracovní série" : "Working sets",
    reps: cz ? "Opakování" : "Reps",
    eccentric: cz ? "Negativní" : "Eccentric",
    concentric: cz ? "Pozitivní" : "Concentric",
    contraction: cz ? "Kontrakce" : "Contraction",
    video: cz ? "Ukázka" : "Demo",
  };

  return (
    <div className="pdays">
      {days.map((day, di) => (
        <div className="pday" key={di}>
          <h3 className="pday-title">{day.label}</h3>
          <div className="pex-list">
            {day.exercises.map((ex, ei) => {
              const name = (cz ? ex.nameCZ : ex.nameEN) || ex.nameEN;
              const cue = cz ? ex.cueCZ : ex.cueEN;
              const stats = [
                [L.workingSets, ex.workingSets],
                [L.reps, ex.reps],
                [L.eccentric, ex.eccentric],
                [L.concentric, ex.concentric],
                [L.contraction, ex.contraction],
              ].filter(([, v]) => v);
              return (
                <div className="pex" key={ei}>
                  <div className="pex-head">
                    <span className="pex-name">{name}</span>
                    {ex.video && (
                      <a className="pex-video" href={ex.video} target="_blank" rel="noopener">
                        ▶ {L.video}
                      </a>
                    )}
                  </div>
                  {stats.length > 0 && (
                    <div className="pex-stats">
                      {stats.map(([k, v], si) => (
                        <span className="pex-stat" key={si}><i>{k}</i>{v}</span>
                      ))}
                    </div>
                  )}
                  {cue && <div className="pex-cue">{cue}</div>}
                  {ex.note && <div className="pex-note">{ex.note}</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
