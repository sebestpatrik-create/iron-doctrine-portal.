-- =====================================================================
--  IRON DOCTRINE — Phase 1, file #2: Row-Level Security
--  Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
--  MODEL (decided together):
--   * App talks to Postgres via the SERVICE ROLE, which BYPASSES RLS.
--     So in normal operation these policies never fire — the server
--     routes do the scoping. RLS here is DEFENSE-IN-DEPTH: the wall that
--     stops a catastrophe if an anon/authenticated key ever leaks or a
--     browser is ever wired straight to the DB.
--   * SMART BACKSTOP (Option 2): a non-service-role caller may READ only
--     rows it legitimately owns (a client sees their own; a coach sees
--     their clients'; platform admin sees all). WRITES are denied to
--     everyone but the service role (no write policies exist -> default deny).
--
--  Safe to re-run: every policy is dropped-if-exists before create.
-- =====================================================================

-- ---------------------------------------------------------------------
--  Predicate helpers (SECURITY DEFINER so they bypass RLS on the tables
--  they read — this is what prevents infinite policy recursion).
-- ---------------------------------------------------------------------

-- True if the current user may see this client: the owning coach, the
-- client themselves, or a platform admin.
create or replace function can_read_client(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from clients cl
    where cl.id = c
      and (
        cl.coach_id = current_coach_id()
        or cl.auth_user_id = auth.uid()
        or is_platform_admin()
      )
  );
$$;

-- True if the current user may see this program (walks program -> client).
create or replace function can_read_program(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from programs pr
    where pr.id = p and can_read_client(pr.client_id)
  );
$$;

-- ---------------------------------------------------------------------
--  Turn RLS ON for every table. With RLS on and NO write policies,
--  writes are denied to anon/authenticated by default; service role
--  bypasses all of this.
-- ---------------------------------------------------------------------
alter table coaches              enable row level security;
alter table clients              enable row level security;
alter table exercises            enable row level security;
alter table programs             enable row level security;
alter table program_exercises    enable row level security;
alter table meal_plans           enable row level security;
alter table supplement_protocols enable row level security;
alter table check_ins            enable row level security;
alter table meal_plan_library    enable row level security;
alter table supplement_library   enable row level security;

-- =====================================================================
--  READ POLICIES (SELECT only; scoped TO authenticated so anonymous
--  visitors get nothing).
-- =====================================================================

-- COACHES: a coach sees their own row; platform admin sees all.
drop policy if exists coaches_read on coaches;
create policy coaches_read on coaches
  for select to authenticated
  using ( auth_user_id = auth.uid() or is_platform_admin() );

-- CLIENTS: the owning coach, the client themselves, or platform admin.
drop policy if exists clients_read on clients;
create policy clients_read on clients
  for select to authenticated
  using (
    coach_id = current_coach_id()
    or auth_user_id = auth.uid()
    or is_platform_admin()
  );

-- PROGRAMS / MEAL_PLANS / SUPPLEMENT_PROTOCOLS / CHECK_INS:
--   readable if the row's client is one you're allowed to see.
drop policy if exists programs_read on programs;
create policy programs_read on programs
  for select to authenticated
  using ( can_read_client(client_id) );

drop policy if exists meal_plans_read on meal_plans;
create policy meal_plans_read on meal_plans
  for select to authenticated
  using ( can_read_client(client_id) );

drop policy if exists supplement_protocols_read on supplement_protocols;
create policy supplement_protocols_read on supplement_protocols
  for select to authenticated
  using ( can_read_client(client_id) );

drop policy if exists check_ins_read on check_ins;
create policy check_ins_read on check_ins
  for select to authenticated
  using ( can_read_client(client_id) );

-- PROGRAM_EXERCISES: one more hop (exercise -> program -> client).
drop policy if exists program_exercises_read on program_exercises;
create policy program_exercises_read on program_exercises
  for select to authenticated
  using ( can_read_program(program_id) );

-- EXERCISES + LIBRARIES: shared reference data — any logged-in user reads.
drop policy if exists exercises_read on exercises;
create policy exercises_read on exercises
  for select to authenticated using ( true );

drop policy if exists meal_plan_library_read on meal_plan_library;
create policy meal_plan_library_read on meal_plan_library
  for select to authenticated using ( true );

drop policy if exists supplement_library_read on supplement_library;
create policy supplement_library_read on supplement_library
  for select to authenticated using ( true );

-- =====================================================================
--  WRITES: intentionally NO insert/update/delete policies.
--  => anon/authenticated cannot write anything (default deny).
--  => the service role (your server routes) bypasses RLS and writes freely.
--  This is the "strict writes" decision, enforced by the database itself.
-- =====================================================================

-- =====================================================================
--  Done. RLS is armed. Nothing visible changes yet (tables empty, app
--  still on Notion). Real verification comes after the data migration.
-- =====================================================================
