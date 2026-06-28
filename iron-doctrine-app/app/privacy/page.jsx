import { CONTROLLER, POLICY_VERSION } from "../../lib/legal.js";

export const metadata = { title: "Privacy — Iron Doctrine" };

const CONTENT = {
  cs: {
    label: "Zásady ochrany osobních údajů",
    updated: "Verze",
    toggle: "English",
    toggleHref: "/privacy?lang=en",
    sections: [
      ["Správce osobních údajů", [
        `Správcem tvých osobních údajů je ${CONTROLLER.name}. V otázkách ochrany údajů nás můžeš kontaktovat na ${CONTROLLER.email}.`,
      ]],
      ["Jaké údaje zpracováváme", [
        "Identifikační a kontaktní údaje: jméno, e-mail, případně telefon a Instagram.",
        "Tréninkové údaje: tělesná hmotnost, míry, hodnocení (energie, síla, spánek, motivace, trávení) a poznámky z check-inů.",
        "Fotografie progresu, které představují zvláštní kategorii osobních údajů — údaje o zdraví.",
      ]],
      ["Účely a právní základ", [
        "Poskytování osobního coachingu a vedení tréninku — na základě plnění smlouvy (čl. 6 odst. 1 písm. b GDPR).",
        "Zpracování fotografií progresu a údajů o zdraví — výhradně na základě tvého výslovného souhlasu (čl. 9 odst. 2 písm. a GDPR).",
      ]],
      ["Příjemci a zpracovatelé", [
        "Supabase — hosting databáze a soukromé úložiště fotografií (EU, Stockholm).",
        "Notion — vedení databáze klientů (USA; předání zajištěno standardními smluvními doložkami).",
        "Vercel — hosting aplikace. Cloudflare — doména a DNS. Brevo — odesílání e-mailů (EU).",
      ]],
      ["Uložení a doba uchování", [
        "Fotografie progresu jsou uloženy v soukromém úložišti v EU a nejsou veřejně přístupné. Údaje uchováváme po dobu trvání naší spolupráce a následně je na tvou žádost smažeme.",
      ]],
      ["Tvá práva", [
        "Máš právo na přístup ke svým údajům, jejich opravu, výmaz, omezení zpracování, přenositelnost a vznesení námitky, a právo kdykoli odvolat svůj souhlas.",
        "Máš rovněž právo podat stížnost u dozorového úřadu — Úřad pro ochranu osobních údajů (www.uoou.gov.cz).",
      ]],
      ["Odvolání souhlasu", [
        "Svůj souhlas se zpracováním fotografií progresu a údajů o zdraví můžeš kdykoli odvolat kontaktováním svého trenéra. Odvolání nemá vliv na zákonnost zpracování před jeho odvoláním.",
      ]],
    ],
  },
  en: {
    label: "Privacy Notice",
    updated: "Version",
    toggle: "Česky",
    toggleHref: "/privacy?lang=cs",
    sections: [
      ["Data controller", [
        `The controller of your personal data is ${CONTROLLER.name}. For any data-protection matter, contact us at ${CONTROLLER.email}.`,
      ]],
      ["What data we process", [
        "Identification and contact data: name, email, and optionally phone and Instagram.",
        "Training data: bodyweight, measurements, ratings (energy, strength, sleep, motivation, digestion) and check-in notes.",
        "Progress photos, which constitute a special category of personal data — health data.",
      ]],
      ["Purposes and legal basis", [
        "Providing personal coaching and training guidance — based on performance of a contract (Art. 6(1)(b) GDPR).",
        "Processing progress photos and health data — solely on the basis of your explicit consent (Art. 9(2)(a) GDPR).",
      ]],
      ["Recipients and processors", [
        "Supabase — database hosting and private photo storage (EU, Stockholm).",
        "Notion — client database (USA; transfer safeguarded by Standard Contractual Clauses).",
        "Vercel — application hosting. Cloudflare — domain and DNS. Brevo — email delivery (EU).",
      ]],
      ["Storage and retention", [
        "Progress photos are kept in private EU storage and are not publicly accessible. We retain your data for the duration of our coaching relationship and delete it on your request thereafter.",
      ]],
      ["Your rights", [
        "You have the right to access, rectify, erase, restrict and port your data, to object to processing, and to withdraw your consent at any time.",
        "You also have the right to lodge a complaint with the supervisory authority — in the Czech Republic, the Office for Personal Data Protection (www.uoou.gov.cz).",
      ]],
      ["Withdrawing consent", [
        "You can withdraw your consent to processing progress photos and health data at any time by contacting your coach. Withdrawal does not affect the lawfulness of processing carried out before it.",
      ]],
    ],
  },
};

export default function PrivacyPage({ searchParams }) {
  const lang = searchParams?.lang === "en" ? "en" : "cs";
  const c = CONTENT[lang];

  return (
    <main className="legal-wrap">
      <div className="legal-card">
        <div className="legal-top">
          <a href="/" className="auth-logo legal-logo">Iron <b>Doctrine</b></a>
          <a href={c.toggleHref} className="legal-toggle">{c.toggle}</a>
        </div>
        <div className="eyebrow legal-eyebrow">{c.label}</div>

        {c.sections.map(([h, paras], i) => (
          <section className="legal-sec" key={i}>
            <h2 className="legal-h">{h}</h2>
            {paras.map((p, j) => (
              <p className="legal-p" key={j}>{p}</p>
            ))}
          </section>
        ))}

        <p className="legal-version">
          {c.updated}: {POLICY_VERSION}
        </p>
      </div>
    </main>
  );
}
