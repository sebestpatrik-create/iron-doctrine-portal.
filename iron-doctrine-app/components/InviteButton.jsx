"use client";
import { useState } from "react";

// Sends the client their branded, bilingual invite email (via /api/coach/invite,
// which mints a magic link and sends through Brevo). Runs from the coach's
// browser but only triggers a server send — never touches the coach session.
export default function InviteButton({ clientId, email, name }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [msg, setMsg] = useState("");

  if (!email) {
    return <span className="invite-noemail">No email on file — add one to invite.</span>;
  }

  async function send() {
    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/coach/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, origin: window.location.origin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setState("error");
        setMsg(
          data?.error === "email_not_configured"
            ? "Email isn't configured yet (missing Brevo key)."
            : data?.error === "no_email"
            ? "No email on file for this client."
            : "Couldn't send — please try again."
        );
        return;
      }
      setState("sent");
    } catch {
      setState("error");
      setMsg("Something went wrong — please try again.");
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
        {state === "sending" ? "Sending…" : state === "sent" ? "✓ Invite sent" : "✉ Send invite email"}
      </button>
      {state === "sent" && (
        <span className="invite-ok">{name ? name.split(" ")[0] : "They"} will get a branded login email at {email}.</span>
      )}
      {state === "error" && <span className="invite-err">{msg}</span>}
    </span>
  );
}
