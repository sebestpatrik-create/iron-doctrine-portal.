import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server.js";
import { getPortalData } from "../../../lib/notion.js";
import PortalView from "../../../components/PortalView.jsx";

// Preview route. /c/demo is public (fake data, for prospects). Any real client
// id is ADMIN-ONLY now — no more unguessable-link back door into real data.
export const dynamic = "force-dynamic";

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function PreviewPortal({ params, searchParams }) {
  const override = searchParams?.lang;
  const pickLang = (d) => (override === "cz" || override === "en" ? override : d.lang || "en");

  // Public marketing demo — fake data only, no login required.
  if (params.id === "demo") {
    const d = await getPortalData(null);
    return <PortalView d={d} lang={pickLang(d)} />;
  }

  // Everything else is a real client → admin-only preview tool.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!ADMINS.includes((user.email || "").toLowerCase())) redirect("/portal");

  const d = await getPortalData(params.id);
  return <PortalView d={d} lang={pickLang(d)} />;
}
