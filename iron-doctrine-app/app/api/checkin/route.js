import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server.js";
import { findClientByEmail, createCheckin } from "../../../lib/notion.js";

// Receives a check-in submission. Photos are already uploaded to the client's
// own Storage folder (RLS-enforced); this only stores the metadata + paths in
// Notion. We re-verify the session and that every path is under THIS user's
// folder — defense in depth on top of the storage policies.
export async function POST(request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const clientId = await findClientByEmail(user.email);
  if (!clientId) return NextResponse.json({ error: "no_portal" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { weight, ratings, note, photos, date } = body || {};
  const checkinDate =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : new Date().toISOString().slice(0, 10);

  // A photo path is only accepted if it lives under this user's own folder.
  const prefix = `${user.id}/`;
  const guard = (p) => (typeof p === "string" && p.startsWith(prefix) ? p : null);
  const safePhotos = {
    front: guard(photos && photos.front),
    side: guard(photos && photos.side),
    back: guard(photos && photos.back),
  };

  const cleanRatings = {};
  for (const k of ["energy", "strength", "sleep", "motivation", "digestion"]) {
    const v = ratings && ratings[k];
    if (typeof v === "number" && v >= 1 && v <= 5) cleanRatings[k] = v;
  }

  const w = typeof weight === "number" ? weight : weight ? Number(weight) : null;

  try {
    await createCheckin({
      clientId,
      date: checkinDate,
      weight: w,
      ratings: cleanRatings,
      note: typeof note === "string" ? note.slice(0, 2000) : "",
      photos: safePhotos,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("check-in save failed:", err.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
