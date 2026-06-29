import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server.js";
import { getExerciseLibraryList, getClients } from "../../../../lib/notion.js";
import ProgramBuilder from "../../../../components/ProgramBuilder.jsx";

export const dynamic = "force-dynamic";

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function NewProgramPage({ searchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMINS.includes((user.email || "").toLowerCase())) redirect("/portal");

  const [library, clients] = await Promise.all([getExerciseLibraryList(), getClients()]);
  const preClient = searchParams?.client || "";
  const initial = preClient ? { clientId: preClient, active: true } : null;

  return (
    <main className="coach">
      <nav>
        <a href="/coach" className="brand">Iron <b>Doctrine</b></a>
        <div className="member">
          <span className="label">Coach</span>
        </div>
      </nav>

      <section>
        <div className="wrap pb-wrap">
          <a href={preClient ? `/coach/${preClient}` : "/coach"} className="nc-back">← Back</a>
          <div className="eyebrow">Coach Dashboard</div>
          <h1 className="coach-title">New program</h1>
          <p className="nc-intro">
            Build a training program from your exercise library. Assign it to a client now, or leave it
            as a draft to assign later.
          </p>
          <ProgramBuilder
            library={library}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
            initial={initial}
          />
        </div>
      </section>
    </main>
  );
}
