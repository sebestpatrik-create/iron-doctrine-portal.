export default function Chart({ measurements, lang, emptyText }) {
  const data = (measurements || []).filter((m) => m.weight != null);

  if (data.length === 0) {
    return <p className="muted">{emptyText || "Your weight chart appears after your first check-in."}</p>;
  }

  const W = 720, H = 300, padL = 54, padR = 20, padT = 30, padB = 40;
  const weights = data.map((d) => d.weight);
  let lo = Math.min(...weights), hi = Math.max(...weights);
  if (hi - lo < 3) { const mid = (hi + lo) / 2; lo = mid - 1.75; hi = mid + 1.75; }
  lo = Math.floor(lo); hi = Math.ceil(hi);

  const n = data.length;
  const x = (i) => padL + (n === 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const y = (w) => H - padB - ((w - lo) / (hi - lo)) * (H - padT - padB);

  const pts = data.map((d, i) => [x(i), y(d.weight)]);
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");

  const yTicks = [];
  for (let v = lo; v <= hi; v++) yTicks.push(v);

  const fmt = (iso) => {
    try { const dd = new Date(iso); return dd.toLocaleDateString(lang === "cz" ? "cs-CZ" : "en-GB", { day: "numeric", month: "short" }); }
    catch { return iso; }
  };

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bodyweight progress">
      {yTicks.map((v, i) => (
        <g key={i} style={{fontFamily:"var(--font-oswald), sans-serif"}} fontSize="11" fill="#B8AC8E">
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="rgba(199,154,59,.12)" />
          <text x={padL - 8} y={y(v) + 4} textAnchor="end">{v}</text>
        </g>
      ))}
      {n > 1 && <path d={path} fill="none" stroke="#E4BC58" strokeWidth="2.5" />}
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="5" fill="#E4BC58" stroke="#16130E" strokeWidth="2" />
      ))}
      <g style={{fontFamily:"var(--font-oswald), sans-serif"}} fontSize="11" fill="#B8AC8E" textAnchor="middle">
        <text x={x(0)} y={H - 12}>{fmt(data[0].date)}</text>
        {n > 1 && <text x={x(n - 1)} y={H - 12}>{fmt(data[n - 1].date)}</text>}
      </g>
    </svg>
  );
}
