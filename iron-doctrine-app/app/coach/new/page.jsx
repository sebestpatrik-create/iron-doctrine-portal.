import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server.js";
import NewClientForm from "../../../components/NewClientForm.jsx";

export const dynamic = "force-dynamic";

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function NewClientPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMINS.includes((user.email || "").toLowerCase())) redirect("/portal");

  return (
    <main className="coach">
      <nav>
        <a href="/coach" className="brand">Iron <b>Doctrine</b></a>
        <div className="member">
          <span className="label">Coach</span>
        </div>
      </nav>

      <section>
        <div className="wrap nc-wrap">
          <a href="/coach" className="nc-back">← Clients</a>
          <div className="eyebrow">Coach Dashboard</div>
          <h1 className="coach-title">New client</h1>
          <p className="nc-intro">
            Create a client record. They sign in with the email you enter here and land on their
            portal — after accepting the consent gate on first login.
          </p>
          <NewClientForm />
        </div>
      </section>
    </main>
  );
}
