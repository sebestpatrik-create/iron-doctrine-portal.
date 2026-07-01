-- =====================================================================
--  IRON DOCTRINE — Phase 1 schema (lift-and-shift from Notion)
--  Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
--  This mirrors the CURRENT Notion model exactly. No new features here
--  (new Primary Goal options, new set scheme, new check-in fields all
--  come later, deliberately). RLS is added in a SEPARATE file (002).
--
--  Conventions used on every table:
--    id          uuid  -- the row's permanent unique key (auto-generated)
--    notion_id   text  -- the original Notion page id, for the one-time
--                         data migration + rollback safety (dropped later)
--    created_at / updated_at  -- automatic audit timestamps
-- =====================================================================

-- gen_random_uuid() lives in the pgcrypto extension; make sure it's on.
create extension if not exists pgcrypto;

-- A tiny helper so every table can auto-maintain updated_at on UPDATE.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
--  1) CLIENTS  — the hub. Everything else points back here.
-- =====================================================================
create table clients (
  id               uuid primary key default gen_random_uuid(),
  notion_id        text unique,                       -- migration bridge
  auth_user_id     uuid references auth.users(id) on delete set null,
                                                       -- THE login link:
                                                       -- ties a client row to their Supabase auth user.
                                                       -- Replaces the old email-lookup. Nullable because a
                                                       -- client can exist before they've ever logged in.
  name             text not null,
  email            text,                              -- still stored; used to find/invite before auth link exists
  language         text default 'Czech',              -- 'Czech' | 'English' (flexible text, per your call)
  primary_goal     text,                              -- current Notion values; changes to Lifestyle/Competition in Phase 2
  status           text default 'Active'
                     check (status in ('Lead','Active','Paused','Inactive')),  -- stable set -> CHECK is safe
  start_date       date,
  service          text,                              -- was multi-select; flattened to text for now
  height_cm        numeric,
  phone            text,
  instagram        text,
  notes            text,
  -- GDPR (mirrors the consent fields we added to Notion)
  consent_given    boolean default false,
  consent_date     timestamptz,
  policy_version   text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index clients_auth_user_id_idx on clients(auth_user_id);
create index clients_email_idx        on clients(lower(email));
create trigger clients_set_updated_at before update on clients
  for each row execute function set_updated_at();

-- =====================================================================
--  2) EXERCISES  — your bilingual library (stands alone).
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
  video          text,                                -- URL (mostly empty today)
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create trigger exercises_set_updated_at before update on exercises
  for each row execute function set_updated_at();

-- =====================================================================
--  3) PROGRAMS  — training blocks. Each belongs to one client.
-- =====================================================================
create table programs (
  id             uuid primary key default gen_random_uuid(),
  notion_id      text unique,
  client_id      uuid references clients(id) on delete cascade,
                                                       -- delete a client -> their programs go too (clean)
  title          text not null,
  status         text default 'Draft'
                   check (status in ('Draft','Active','Completed','Archived')),
  focus          text,                                -- Hypertrophy/Strength/... (flexible text)
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
--  4) PROGRAM_EXERCISES  — the JOIN table: an exercise, in a program,
--     on a given day, with its scheme. Sits between programs & exercises.
-- =====================================================================
create table program_exercises (
  id            uuid primary key default gen_random_uuid(),
  notion_id     text unique,
  program_id    uuid not null references programs(id)  on delete cascade,
  exercise_id   uuid          references exercises(id) on delete set null,
                                                       -- keep the row (fallback label) even if a library
                                                       -- exercise is later deleted
  label         text,                                 -- fallback name (title in Notion)
  day           integer,
  sort_order    integer,                              -- "Order" in Notion ("order" is a reserved word in SQL)
  day_label     text,
  sets          text,   -- all scheme fields stay text (they hold "8-12", "2 min", etc.)
  reps          text,   -- these get REPLACED by the new eccentric/concentric/contraction scheme in Phase 2
  rpe           text,
  tempo         text,
  load          text,
  rest          text,
  note          text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index program_exercises_program_id_idx on program_exercises(program_id);
create trigger program_exercises_set_updated_at before update on program_exercises
  for each row execute function set_updated_at();

-- =====================================================================
--  5) MEAL_PLANS  — SHELL ONLY (per your call: no dirty body_md).
--     Real content comes with the nutrition rebuild.
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
--  6) SUPPLEMENT_PROTOCOLS  — SHELL ONLY (rebuilt clean later).
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
--  7) CHECK_INS  — the weekly log. Photos are Storage paths (text).
-- =====================================================================
create table check_ins (
  id             uuid primary key default gen_random_uuid(),
  notion_id      text unique,
  client_id      uuid references clients(id) on delete cascade,
  date           date,
  weight         numeric,
  energy         integer,     -- 1..5
  strength       integer,
  sleep          integer,
  motivation     integer,
  digestion      integer,
  client_note    text,
  coach_feedback text,
  photo_front    text,        -- Supabase Storage path {userId}/{date}/front.jpg
  photo_side     text,
  photo_back     text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index check_ins_client_id_date_idx on check_ins(client_id, date desc);
create trigger check_ins_set_updated_at before update on check_ins
  for each row execute function set_updated_at();

-- =====================================================================
--  8) LIBRARIES  — reusable templates. NOT tied to a client.
-- =====================================================================
create table meal_plan_library (
  id          uuid primary key default gen_random_uuid(),
  notion_id   text unique,
  title       text not null,
  diet        text,   -- Standard/Vegetarian/Vegan/High-protein
  goal        text,   -- Lean gain/Maintenance/Fat loss
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
  goal        text,   -- Foundational/Muscle/Fat loss/Performance
  summary     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- =====================================================================
--  Done. Next file (002) turns on Row-Level Security + policies.
-- =====================================================================
