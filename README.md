import { Client } from "@notionhq/client";
import { DEMO } from "./demo.js";

// Your Notion database IDs (already filled in from your workspace).
// You can override any of these with environment variables on Vercel if they ever change.
const DB = {
  clients: process.env.DB_CLIENTS || "b62535b00aff4226970e3d424383970a",
  programs: process.env.DB_PROGRAMS || "eb4e923a1d694638802ef98896fb31bb",
  meals: process.env.DB_MEALS || "3b5536e3c49241c1854dbd7ec8787ef6",
  supplements: process.env.DB_SUPPLEMENTS || "7c05a2969a6a4eb3a9bd703a0c5f950e",
  measurements: process.env.DB_MEASUREMENTS || "a2f9f4749fd3429186f5fff529701389",
};

export const hasNotion = !!process.env.NOTION_TOKEN;

const notion = hasNotion ? new Client({ auth: process.env.NOTION_TOKEN }) : null;

// ---- tiny property readers ----
const rt = (arr) => (arr || []).map((t) => t.plain_text).join("");
const title = (p) => (p && p.title ? rt(p.title) : "");
const sel = (p) => (p && p.select ? p.select.name : "");
const num = (p) => (p && typeof p.number === "number" ? p.number : null);
const dateStart = (p) => (p && p.date ? p.date.start : null);

// ---- turn Notion page blocks into a simple shape the UI can render ----
async function normalizeBlocks(pageId) {
  const out = [];
  const res = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
  for (const b of res.results) {
    const t = b.type;
    if (t === "heading_1" || t === "heading_2") out.push({ type: "h2", text: rt(b[t].rich_text) });
    else if (t === "heading_3") out.push({ type: "h3", text: rt(b[t].rich_text) });
    else if (t === "paragraph") { const x = rt(b.paragraph.rich_text); if (x.trim()) out.push({ type: "p", text: x }); }
    else if (t === "bulleted_list_item") out.push({ type: "li", text: rt(b.bulleted_list_item.rich_text) });
    else if (t === "numbered_list_item") out.push({ type: "li", text: rt(b.numbered_list_item.rich_text) });
    else if (t === "quote") out.push({ type: "quote", text: rt(b.quote.rich_text) });
    else if (t === "divider") out.push({ type: "divider" });
    else if (t === "table") {
      const rows = await notion.blocks.children.list({ block_id: b.id, page_size: 100 });
      const cells = rows.results
        .filter((r) => r.type === "table_row")
        .map((r) => r.table_row.cells.map((c) => rt(c)));
      const header = b.table.has_column_header && cells.length ? cells.shift() : null;
      out.push({ type: "table", header, rows: cells });
    }
  }
  return out;
}

// Find the active record in a database that is linked to this client.
async function activeFor(databaseId, clientId) {
  const res = await notion.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        { property: "Client", relation: { contains: clientId } },
        { property: "Status", select: { equals: "Active" } },
      ],
    },
    page_size: 1,
  });
  return res.results[0] || null;
}

export async function getPortalData(clientId) {
  // No token yet, or no id → show the demo so the page always renders.
  if (!hasNotion || !clientId) return { ...DEMO, demo: true };

  try {
    const client = await notion.pages.retrieve({ page_id: clientId });
    const cp = client.properties;
    const name = title(cp["Name"]) || "Athlete";
    const goal = sel(cp["Primary Goal"]) || "";

    const [program, meal, supp, measRes] = await Promise.all([
      activeFor(DB.programs, clientId),
      activeFor(DB.meals, clientId),
      activeFor(DB.supplements, clientId),
      notion.databases.query({
        database_id: DB.measurements,
        filter: { property: "Client", relation: { contains: clientId } },
        sorts: [{ property: "Date", direction: "ascending" }],
        page_size: 100,
      }),
    ]);

    const programBlocks = program ? await normalizeBlocks(program.id) : [];
    const suppBlocks = supp ? await normalizeBlocks(supp.id) : [];
    const supplements = suppBlocks
      .filter((b) => b.type === "li" || b.type === "p")
      .map((b) => b.text.replace(/\*\*/g, ""))
      .filter(Boolean);

    const mp = meal ? meal.properties : {};
    const macros = {
      kcal: num(mp["Calories (kcal)"]) ?? 0,
      protein: num(mp["Protein (g)"]) ?? 0,
      carbs: num(mp["Carbs (g)"]) ?? 0,
      fat: num(mp["Fat (g)"]) ?? 0,
    };

    const measurements = measRes.results
      .map((m) => ({ date: dateStart(m.properties["Date"]), weight: num(m.properties["Weight (kg)"]) }))
      .filter((m) => m.date && m.weight != null);

    return {
      name,
      goal,
      weekLabel: program ? title(program.properties["Program"]) : goal,
      todayNote: `Your plan is ready. Five quality sessions beat fifty half-hearted ones.`,
      programName: program ? title(program.properties["Program"]) : "Your program",
      programBlocks,
      macros,
      supplements: supplements.length ? supplements : DEMO.supplements,
      measurements,
      weeklyTarget: null,
      demo: false,
    };
  } catch (err) {
    console.error("Notion read failed, showing demo:", err.message);
    return { ...DEMO, demo: true, error: true };
  }
}
