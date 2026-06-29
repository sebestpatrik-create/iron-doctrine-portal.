// Brevo (transactional) email client. We send via the HTTP API rather than SMTP
// because a single HTTPS POST is fast, stateless, and reliable from a serverless
// function — no held-open SMTP connections. Supabase keeps using Brevo SMTP for
// its own auth mail; this is a separate path for our own branded sends.

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "Patrik @ Iron Doctrine", email: "noreply@irondoctrineapp.com" };

const COPY = {
  cz: {
    subject: "Tvůj přístup do Iron Doctrine",
    heading: "Vítej v Iron Doctrine",
    greeting: (n) => `Ahoj ${n},`,
    body: "tvůj trenér Patrik ti zřídil přístup do klientského portálu. Klikni na tlačítko níže a jsi uvnitř — žádné heslo není potřeba.",
    button: "Vstoupit do portálu →",
    note: (origin) =>
      `Odkaz je platný omezenou dobu. Pokud vyprší, požádej trenéra o nový — nebo se kdykoli přihlas svým e-mailem na <a href="${origin}/login" style="color:#C79A3B;">${origin.replace(/^https?:\/\//, "")}/login</a>.`,
    ignore: "Pokud jsi o tento přístup nežádal/a, tento e-mail ignoruj.",
    tagline: "Old-school iron. Modern coaching.",
  },
  en: {
    subject: "Your Iron Doctrine access",
    heading: "Welcome to Iron Doctrine",
    greeting: (n) => `Hi ${n},`,
    body: "your coach Patrik has set up your client portal. Tap the button below and you're in — no password needed.",
    button: "Enter your portal →",
    note: (origin) =>
      `This link is valid for a limited time. If it expires, ask your coach for a new one — or sign in any time with your email at <a href="${origin}/login" style="color:#C79A3B;">${origin.replace(/^https?:\/\//, "")}/login</a>.`,
    ignore: "If you weren't expecting this, you can safely ignore this email.",
    tagline: "Old-school iron. Modern coaching.",
  },
};

function inviteHtml({ name, link, lang, origin }) {
  const t = COPY[lang === "cz" ? "cz" : "en"];
  const first = (name || "").trim().split(/\s+/)[0] || (lang === "cz" ? "kliente" : "there");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0E0C08;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0E0C08;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#16130E;border:1px solid rgba(199,154,59,.26);border-radius:16px;overflow:hidden;">
        <tr><td style="padding:34px 36px 0;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:.5px;color:#ECE3CF;font-weight:bold;">IRON <span style="color:#C79A3B;">DOCTRINE</span></div>
          <div style="height:1px;background:rgba(199,154,59,.26);margin:18px 0 0;"></div>
        </td></tr>
        <tr><td style="padding:28px 36px 0;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#ECE3CF;text-transform:uppercase;letter-spacing:.5px;">${t.heading}</h1>
          <p style="margin:18px 0 0;font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#ECE3CF;">${t.greeting(first)}</p>
          <p style="margin:10px 0 0;font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#B8AC8E;">${t.body}</p>
        </td></tr>
        <tr><td style="padding:26px 36px 0;" align="left">
          <a href="${link}" style="display:inline-block;background:#C79A3B;color:#1a1509;font-family:Arial,sans-serif;font-weight:bold;text-transform:uppercase;letter-spacing:1px;font-size:14px;text-decoration:none;padding:14px 28px;border-radius:9px;">${t.button}</a>
        </td></tr>
        <tr><td style="padding:24px 36px 0;">
          <p style="margin:0;font-family:Georgia,serif;font-size:13px;line-height:1.6;color:#7A6336;">${t.note(origin)}</p>
        </td></tr>
        <tr><td style="padding:22px 36px 34px;">
          <div style="height:1px;background:rgba(199,154,59,.26);margin:0 0 16px;"></div>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#7A6336;">Iron Doctrine · ${t.tagline}</p>
          <p style="margin:8px 0 0;font-family:Georgia,serif;font-size:12px;color:#7A6336;">${t.ignore}</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export function emailConfigured() {
  return !!process.env.BREVO_API_KEY;
}

// Sends the branded invite. Throws on failure so the route can report it.
export async function sendInviteEmail({ to, name, link, lang, origin }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY not configured");
  const t = COPY[lang === "cz" ? "cz" : "en"];

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: to, name: name || undefined }],
      subject: t.subject,
      htmlContent: inviteHtml({ name, link, lang, origin }),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo send failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return true;
}
