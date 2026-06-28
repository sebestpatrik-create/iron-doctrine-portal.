import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server.js";
import { findClientByEmail, getClientMeta } from "../../../lib/notion.js";
import ConsentGate from "../../../components/ConsentGate.jsx";

export const dynamic = "force-dynamic";

export default async function ConsentPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clientId = await findClientByEmail(user.email);
  if (!clientId) redirect("/portal");

  const meta = await getClientMeta(clientId);
  if (meta.consentGiven) redirect("/portal");

  return <ConsentGate lang={meta.lang} name={meta.name} />;
}
