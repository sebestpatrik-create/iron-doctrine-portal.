import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server.js";
import { findClientByEmail, getClientMeta } from "../../../lib/notion.js";
import CheckInForm from "../../../components/CheckInForm.jsx";
import { t } from "../../../lib/i18n.js";

export const dynamic = "force-dynamic";

export default async function CheckInPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clientId = await findClientByEmail(user.email);
  if (!clientId) redirect("/portal");

  const { lang } = await getClientMeta(clientId);

  return (
    <main className="ci-page">
      <nav>
        <a href="/portal" className="brand">Iron <b>Doctrine</b></a>
      </nav>
      <section>
        <div className="wrap ci-wrap">
          <div className="eyebrow">{t(lang, "weeklyCheckin")}</div>
          <h1 className="ci-title">{lang === "cz" ? "Týdenní check-in" : "Weekly Check-in"}</h1>
          <p className="ci-intro">
            {lang === "cz"
              ? "Pár čísel a fotky. Zabere to minutu."
              : "A few numbers and photos. Takes a minute."}
          </p>
          <CheckInForm userId={user.id} lang={lang} />
        </div>
      </section>
    </main>
  );
}
