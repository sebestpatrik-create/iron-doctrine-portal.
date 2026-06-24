import { getPortalData } from "../../../lib/notion.js";
import PortalView from "../../../components/PortalView.jsx";

// Preview link: /c/<notion-page-id>. No login — handy for you to spot-check a
// client's page. ?lang=cz|en overrides the language for previewing.
export const dynamic = "force-dynamic";

export default async function PreviewPortal({ params, searchParams }) {
  const d = await getPortalData(params.id);
  const override = searchParams?.lang;
  const lang = override === "cz" || override === "en" ? override : d.lang || "en";
  return <PortalView d={d} lang={lang} />;
}
