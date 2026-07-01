-- =====================================================================
--  IRON DOCTRINE — file #5: new set scheme (B5)
--  Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
--  Replaces the old prescription fields with the tempo-first scheme:
--    Working sets · Reps · Eccentric (slow) · Concentric (dynamic) · Contraction
--  Safe: program_exercises is empty (no program data was migrated).
-- =====================================================================

alter table program_exercises rename column sets to working_sets;
alter table program_exercises drop column if exists rpe;
alter table program_exercises drop column if exists tempo;
alter table program_exercises drop column if exists load;
alter table program_exercises drop column if exists rest;
alter table program_exercises add column if not exists eccentric   text;
alter table program_exercises add column if not exists concentric  text;
alter table program_exercises add column if not exists contraction text;
