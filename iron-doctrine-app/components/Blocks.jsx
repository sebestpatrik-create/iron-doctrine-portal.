function Table({ b }) {
  const header = b.header || [];
  return (
    <div className="workout">
      <table className="rtable">
        {header.length > 0 && (
          <thead>
            <tr>{header.map((h, i) => <th key={i} className={i === 0 ? "" : "r"}>{h}</th>)}</tr>
          </thead>
        )}
        <tbody>
          {b.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className={ci === 0 ? "ex" : "num r"} data-label={header[ci] || ""}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Blocks({ blocks, emptyText }) {
  if (!blocks || !blocks.length) {
    return <p className="muted">{emptyText || "Your program will appear here once it\u2019s assigned."}</p>;
  }
  return (
    <div className="blocks">
      {blocks.map((b, i) => {
        if (b.type === "h2") return <h3 key={i} className="wk-h">{b.text}</h3>;
        if (b.type === "h3") return <h4 key={i} className="wk-h3">{b.text}</h4>;
        if (b.type === "p") return <p key={i} className="wk-p">{b.text.replace(/\*\*/g, "")}</p>;
        if (b.type === "li") return <p key={i} className="wk-li">• {b.text.replace(/\*\*/g, "")}</p>;
        if (b.type === "quote") return <blockquote key={i} className="wk-quote">{b.text.replace(/\*\*/g, "")}</blockquote>;
        if (b.type === "divider") return <hr key={i} className="wk-hr" />;
        if (b.type === "table") return <Table key={i} b={b} />;
        return null;
      })}
    </div>
  );
}
