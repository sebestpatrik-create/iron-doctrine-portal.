"use client";
import { useState } from "react";
import { createClient } from "../../lib/supabase/client.js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | sent
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    setState("sending");
    setErr("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) {
        setErr(error.message || "Couldn't send the link. Try again.");
        setState("idle");
      } else {
        setState("sent");
      }
    } catch {
      setErr("Something went wrong. Please try again.");
      setState("idle");
    }
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Iron <b>Doctrine</b></div>
        <div className="auth-eyebrow eyebrow">Member Portal</div>

        {state === "sent" ? (
          <div className="auth-success">
            <div className="big">Check your email</div>
            <p className="auth-sub">
              We sent a magic link to <b style={{ color: "var(--cream)" }}>{email.trim()}</b>.
              Click it to enter your portal — it expires shortly.
            </p>
            <p className="auth-note">
              Didn&apos;t get it? Check spam, or{" "}
              <a href="/login" style={{ color: "var(--gold)" }}>try again</a>.
            </p>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Enter the Temple</h1>
            <p className="auth-sub">
              Sign in with your email. No password — we&apos;ll send you a one-time link.
            </p>
            <form className="auth-form" onSubmit={submit}>
              <input
                className="auth-input"
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {err && <div className="auth-error">{err}</div>}
              <button className="auth-btn" type="submit" disabled={state === "sending"}>
                {state === "sending" ? "Sending…" : "Send my magic link →"}
              </button>
            </form>
            <p className="auth-note">
              Only registered Iron Doctrine clients can sign in. Use the email your coach has on file.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
