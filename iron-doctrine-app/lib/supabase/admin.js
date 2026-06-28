import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY service-role client. Bypasses RLS — never import this into any
// client component or anything that ships to the browser. Used only inside
// admin-gated API routes for erasure.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin not configured (missing SUPABASE_SERVICE_ROLE_KEY)");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Find an auth user by email (listUsers is paginated; scan a few pages).
export async function findAuthUserByEmail(admin, email) {
  const target = (email || "").toLowerCase();
  if (!target) return null;
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => (u.email || "").toLowerCase() === target);
    if (found) return found;
    if (!data.users.length || data.users.length < perPage) return null;
  }
  return null;
}

// Delete every object under {uid}/ in the private checkins bucket.
export async function deleteUserPhotos(admin, uid) {
  const bucket = admin.storage.from("checkins");
  const toRemove = [];
  const { data: dateFolders, error } = await bucket.list(uid, { limit: 1000 });
  if (error) throw error;
  for (const folder of dateFolders || []) {
    const { data: files } = await bucket.list(`${uid}/${folder.name}`, { limit: 1000 });
    for (const f of files || []) toRemove.push(`${uid}/${folder.name}/${f.name}`);
  }
  if (toRemove.length) {
    const { error: rmErr } = await bucket.remove(toRemove);
    if (rmErr) throw rmErr;
  }
  return toRemove.length;
}
