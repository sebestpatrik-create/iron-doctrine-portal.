import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server.js";

export const dynamic = "force-dynamic";

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function Home() {
  // Already signed in → send straight to the right place.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(ADMINS.includes((user.email || "").toLowerCase()) ? "/coach" : "/portal");
  }

  return (
    <main className="landing">
      <div>
        <div className="wordmark">Iron <b>Doctrine</b></div>
        <p>
          This is the Iron Doctrine member portal. Each athlete has their own personal
          link — open yours to see your training, nutrition, and progress.
        </p>
        <p style={{ marginTop: 28 }}>
          <a className="btn btn-ghost" href="/c/demo">View the demo portal →</a>
        </p>
      </div>
    </main>
  );
}
