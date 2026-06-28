"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "../lib/i18n.js";

export default function ConsentGate({ lang, name }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState("");

  async function agree() {
    if (!checked) {
      setErr(t(lang, "consentRequired"));
      return;
    }
    setErr("");
    setStatus("saving");
    try {
      const res = await fetch("/api/consent", { method: "POST" });
      if (!res.ok) throw new Error("save");
      router.push("/portal");
      router.refresh();
    } catch {
      setStatus("idle");
      setErr(t(lang, "consentError"));
    }
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card consent-card">
        <div className="auth-logo">Iron <b>Doctrine</b></div>
        <div className="eyebrow" style={{ textAlign: "center", marginBottom: "16px" }}>
          {t(lang, "consentEyebrow")}
        </div>
        <h1 className="consent-title">{t(lang, "consentTitle")}</h1>
        <p className="consent-intro">{t(lang, "consentIntro")}</p>

        <label className="consent-check">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
              if (e.target.checked) setErr("");
            }}
          />
          <span>{t(lang, "consentCheckbox")}</span>
        </label>

        <a
          href={`/privacy?lang=${lang}`}
          className="consent-policy-link"
          target="_blank"
          rel="noreferrer"
        >
          {t(lang, "consentReadPolicy")} ↗
        </a>

        {err && <div className="consent-err">{err}</div>}

        <button className="auth-btn consent-btn" onClick={agree} disabled={status === "saving"}>
          {status === "saving" ? t(lang, "consentSaving") : t(lang, "consentAgree")}
        </button>

        <p className="consent-withdraw">{t(lang, "consentWithdraw")}</p>
      </div>
    </main>
  );
}
