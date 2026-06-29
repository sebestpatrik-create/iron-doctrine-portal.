import { redirect } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server.js";
import { getExerciseLibraryList, getClients, getProgramForEdit } from "../../../../../lib/notion.js";
import ProgramBuilder from "../../../../../components/ProgramBuilder.jsx";

export const dynamic = "force-dynamic";

const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function EditProgramPage({ params }) {
  const programId = (params && (params.programId || Object.values(params)[0])) || "";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMINS.includes((user.email || "").toLowerCase())) redirect("/portal");

  const [library, clients, initial] = await Promise.all([
    getExerciseLibraryList(),
    getClients(),
    getProgramForEdit(programId),
  ]);
  if (!initial) redirect("/coach");

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
          <a href={initial.clientId ? `/coach/${initial.clientId}` : "/coach"} className="nc-back">← Back</a>
          <div className="eyebrow">Coach Dashboard</div>
          <h1 className="coach-title">Edit program</h1>
          <p className="nc-intro">
            Saving replaces this program&apos;s exercises with what&apos;s below. The client&apos;s portal
            updates immediately.
          </p>
          <ProgramBuilder
            library={library}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
            initial={initial}
            programId={programId}
          />
        </div>
      </section>
    </main>
  );
}
