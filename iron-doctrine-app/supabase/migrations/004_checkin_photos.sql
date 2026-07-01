-- =====================================================================
--  IRON DOCTRINE — file #4: check-in photos → variable list (E2)
--  Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
--  Replaces the 3 fixed photo columns (front/side/back) with a single
--  `photos` JSON array, so a check-in can carry up to 10 unnamed photos.
--  Safe: check_ins is empty (no check-in data was migrated), so there's
--  nothing to convert.
-- =====================================================================

alter table check_ins drop column if exists photo_front;
alter table check_ins drop column if exists photo_side;
alter table check_ins drop column if exists photo_back;
alter table check_ins add column if not exists photos jsonb not null default '[]'::jsonb;
