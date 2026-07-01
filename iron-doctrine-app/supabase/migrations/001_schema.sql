-- =====================================================================
--  IRON DOCTRINE — Phase 1 schema (lift-and-shift + multi-tenant)
--  Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
--  CLEAN COMBINED schema. Drops the empty tables from the first run and
--  recreates everything, now with multi-coach support:
--    - a `coaches` table (each coach is a row, linked to their auth login)
--    - `clients.coach_id` so every client belongs to exactly one coach
--    - helper functions the RLS policies (file 002) build on
--  Faithful lift-and-shift otherwise: no new feature columns.
--  RLS is ENABLED + POLICIED in the separate 002 file.
-- =====================================================================

-- ---- Clean slate (safe: these tables are empty) --------------------
drop table if exists check_ins            cascade;
drop table if exists program_exercises    cascade;
drop table if exists programs             cascade;
drop table if exists meal_plans           cascade;
drop table if exists supplement_protocols cascade;
drop table if exists meal_plan_library    cascade;
drop table if exists supplement_library   cascade;
drop table if exists exercises            cascade;
drop table if exists clients              cascade;
drop table if exists coaches              cascade;

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
--  0) COACHES  — NEW. Each coach is a row. Makes the app multi-tenant.
-- =====================================================================
create table coaches (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  name          text not null,
  email         text,
  role          text not null default 'coach'
                  check (role in ('coach','platform_admin')),
  status        text not null default 'active'
                  check (status in ('active','paused','disabled')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index coaches_auth_user_id_idx on coaches(auth_user_id);
create trigger coaches_set_updated_at before update on coaches
  for each row execute function set_updated_at();

-- =====================================================================
--  RLS HELPER FUNCTIONS (used by policies in file 002)
--  SECURITY DEFINER lets these read `coaches` without tripping its RLS.
-- =====================================================================
create or replace function current_coach_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from coaches where auth_user_id = auth.uid() limit 1;
$$;

create or replace function is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from coaches
    where auth_user_id = auth.uid() and role = 'platform_admin'
  );
$$;

-- =====================================================================
--  1) CLIENTS  — now owned by a coach (coach_id).
-- =====================================================================
create table clients (
  id               uuid primary key default gen_random_uuid(),
  notion_id        text unique,
  coach_id         uuid references coaches(id) on delete set null,
  auth_user_id     uuid references auth.users(id) on delete set null,
  name             text not null,
  email            text,
  language         text default 'Czech',
  primary_goal     text,
  status           text default 'Active'
                     check (status in ('Lead','Active','Paused','Inactive')),
  start_date       date,
  service          text,
  height_cm        numeric,
  phone            text,
  instagram        text,
  notes            text,
  consent_given    boolean default false,
  consent_date     timestamptz,
  policy_version   text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index clients_coach_id_idx      on clients(coach_id);
create index clients_auth_user_id_idx  on clients(auth_user_id);
create index clients_email_idx         on clients(lower(email));
create trigger clients_set_updated_at before update on clients
  for each row execute function set_updated_at();

-- =====================================================================
--  2) EXERCISES  — shared library (global for now).
-- =====================================================================
create table exercises (
  id             uuid primary key default gen_random_uuid(),
  notion_id      text unique,
  name_en        text not null,
  name_cz        text,
  primary_muscle text,
  movement       text,
  equipment      text,
  cue_en         text,
  cue_cz         text,
  video          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create trigger exercises_set_updated_at before update on exercises
  for each row execute function set_updated_at();

-- =====================================================================
--  3) PROGRAMS
-- =====================================================================
create table programs (
  id             uuid primary key default gen_random_uuid(),
  notion_id      text unique,
  client_id      uuid references clients(id) on delete cascade,
  title          text not null,
  status         text default 'Draft'
                   check (status in ('Draft','Active','Completed','Archived')),
  focus          text,
  days_per_week  integer,
  notes          text,
  start_date     date,
  end_date       date,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index programs_client_id_idx on programs(client_id);
create index programs_active_idx    on programs(client_id) where status = 'Active';
create trigger programs_set_updated_at before update on programs
  for each row execute function set_updated_at();

-- =====================================================================
--  4) PROGRAM_EXERCISES  — the join.
-- =====================================================================
create table program_exercises (
  id            uuid primary key default gen_random_uuid(),
  notion_id     text unique,
  program_id    uuid not null references programs(id)  on delete cascade,
  exercise_id   uuid          references exercises(id) on delete set null,
  label         text,
  day           integer,
  sort_order    integer,
  day_label     text,
  working_sets  text,
  reps          text,
  eccentric     text,   -- negative phase (slow)
  concentric    text,   -- positive phase (dynamic)
  contraction   text,
  note          text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index program_exercises_program_id_idx on program_exercises(program_id);
create trigger program_exercises_set_updated_at before update on program_exercises
  for each row execute function set_updated_at();

-- =====================================================================
--  5) MEAL_PLANS  — SHELL ONLY.
-- =====================================================================
create table meal_plans (
  id          uuid primary key default gen_random_uuid(),
  notion_id   text unique,
  client_id   uuid references clients(id) on delete cascade,
  title       text not null,
  status      text default 'Draft'
                check (status in ('Draft','Active','Completed','Archived')),
  calories    numeric,
  protein_g   numeric,
  carbs_g     numeric,
  fat_g       numeric,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index meal_plans_client_id_idx on meal_plans(client_id);
create trigger meal_plans_set_updated_at before update on meal_plans
  for each row execute function set_updated_at();

-- =====================================================================
--  6) SUPPLEMENT_PROTOCOLS  — SHELL ONLY.
-- =====================================================================
create table supplement_protocols (
  id          uuid primary key default gen_random_uuid(),
  notion_id   text unique,
  client_id   uuid references clients(id) on delete cascade,
  title       text not null,
  status      text default 'Draft'
                check (status in ('Draft','Active','Completed','Archived')),
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index supplement_protocols_client_id_idx on supplement_protocols(client_id);
create trigger supplement_protocols_set_updated_at before update on supplement_protocols
  for each row execute function set_updated_at();

-- =====================================================================
--  7) CHECK_INS
-- =====================================================================
create table check_ins (
  id             uuid primary key default gen_random_uuid(),
  notion_id      text unique,
  client_id      uuid references clients(id) on delete cascade,
  date           date,
  weight         numeric,
  energy         integer,
  strength       integer,
  sleep          integer,
  motivation     integer,
  digestion      integer,
  client_note    text,
  coach_feedback text,
  photos         jsonb not null default '[]'::jsonb,  -- up to 10 unnamed photos (was photo_front/side/back)
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index check_ins_client_id_date_idx on check_ins(client_id, date desc);
create trigger check_ins_set_updated_at before update on check_ins
  for each row execute function set_updated_at();

-- =====================================================================
--  8) LIBRARIES
-- =====================================================================
create table meal_plan_library (
  id          uuid primary key default gen_random_uuid(),
  notion_id   text unique,
  title       text not null,
  diet        text,
  goal        text,
  calories    numeric,
  protein_g   numeric,
  carbs_g     numeric,
  fat_g       numeric,
  summary     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table supplement_library (
  id          uuid primary key default gen_random_uuid(),
  notion_id   text unique,
  title       text not null,
  goal        text,
  summary     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- =====================================================================
--  Done. Next: file 002 enables RLS + installs per-coach policies.
-- =====================================================================
