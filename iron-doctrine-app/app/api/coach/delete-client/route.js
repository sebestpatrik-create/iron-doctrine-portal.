import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server.js";
import {
  createAdminClient,
  findAuthUserByEmail,
  deleteUserPhotos,
} from "../../../../lib/supabase/admin.js";
import { getClientContact, archiveClientAndCheckins } from "../../../../lib/notion.js";

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ADMINS.includes((user.email || "").toLowerCase()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { clientId, confirmName } = body || {};
  if (!clientId || typeof clientId !== "string")
    return NextResponse.json({ error: "bad_request" }, { status: 400 });

  let contact;
  try {
    contact = await getClientContact(clientId);
  } catch {
    return NextResponse.json({ error: "client_not_found" }, { status: 404 });
  }

  // Safety interlock: the typed name must match the client's name exactly.
  if (!confirmName || confirmName.trim() !== (contact.name || "").trim())
    return NextResponse.json({ error: "name_mismatch" }, { status: 400 });

  const report = { authUser: false, photos: 0, notionCheckins: 0, notionClient: false, errors: [] };

  // 1) Supabase: wipe photos + auth user.
  try {
    const admin = createAdminClient();
    if (contact.email) {
      const authUser = await findAuthUserByEmail(admin, contact.email);
      if (authUser) {
        try {
          report.photos = await deleteUserPhotos(admin, authUser.id);
        } catch (e) {
          report.errors.push("photos: " + e.message);
        }
        try {
          const { error } = await admin.auth.admin.deleteUser(authUser.id);
          if (error) throw error;
          report.authUser = true;
        } catch (e) {
          report.errors.push("authUser: " + e.message);
        }
      }
    }
  } catch (e) {
    report.errors.push("supabase: " + e.message);
  }

  // 2) Notion: archive all check-ins + the client row.
  try {
    report.notionCheckins = await archiveClientAndCheckins(clientId);
    report.notionClient = true;
  } catch (e) {
    report.errors.push("notion: " + e.message);
  }

  const ok = report.errors.length === 0;
  return NextResponse.json({ ok, report }, { status: ok ? 200 : 207 });
}
