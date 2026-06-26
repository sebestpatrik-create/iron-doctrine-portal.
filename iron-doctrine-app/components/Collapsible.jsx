"use client";
import { useState } from "react";

// A rollout section: tap the header to expand/collapse the body. Keeps the
// client portal short — each plan section opens only when wanted.
export default function Collapsible({ eyebrow, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={"collapse" + (open ? " open" : "")}>
      <button type="button" className="collapse-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="collapse-titles">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <span className="sec-title">{title}</span>
        </span>
        <span className="collapse-chev" aria-hidden="true">⌄</span>
      </button>
      <div className="collapse-body" hidden={!open}>{children}</div>
    </div>
  );
}
