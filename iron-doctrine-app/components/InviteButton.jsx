"use client";
import { useState } from "react";
import { createClient } from "../lib/supabase/client.js";

// Sends the client their magic-link login email — the same one the normal login
// flow uses (and it creates their auth user if they don't have one yet). Runs
// from the coach's browser; it only triggers an email, so it never touches the
// coach's own session.
export default function InviteButton({ email, name }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [msg, setMsg] = useState("");

  if (!email) {
    return <span className="invite-noemail">No email on file — add one to invite.</span>;
  }

  async function send() {
    setState("sending");
    setMsg("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) {
        setState("error");
        setMsg(error.message || "Couldn't send — try again.");
        return;
      }
      setState("sent");
    } catch {
      setState("error");
      setMsg("Something went wrong — try again.");
    }
  }

  return (
    <span className="invite">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={send}
        disabled={state === "sending" || state === "sent"}
      >
        {state === "sending" ? "Sending…" : state === "sent" ? "✓ Link sent" : "✉ Send login link"}
      </button>
      {state === "sent" && (
        <span className="invite-ok">{name ? name.split(" ")[0] : "They"} will get a magic link at {email}.</span>
      )}
      {state === "error" && <span className="invite-err">{msg}</span>}
    </span>
  );
}
