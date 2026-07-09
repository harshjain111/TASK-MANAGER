-- 0007_mutes.sql
-- Per-user mute preference for a project or a specific column (P18).
--
-- Enforcement note: today the only notification types the app creates are
-- `task_assigned` and `mention` (P15, P17) — and CLAUDE.md explicitly says
-- both must bypass mute ("except for direct assignments and @mentions").
-- So there is currently nothing muted notifications need to be filtered
-- out of; this table + is_column_muted()/is_project_muted() below is the
-- gate future notification types (e.g. a general "new activity" ping) must
-- consult before inserting — assigned/mention deliberately skip that gate.

create table mutes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references projects (id) on delete cascade,
  column_id uuid references board_columns (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint mutes_exactly_one_scope check (
    (project_id is not null and column_id is null)
    or (project_id is null and column_id is not null)
  ),
  unique (user_id, project_id, column_id)
);

create index mutes_user_id_idx on mutes (user_id);

alter table mutes enable row level security;

create policy "Users can view their own mutes"
  on mutes for select
  using (user_id = auth.uid());

create policy "Users can create their own mutes"
  on mutes for insert
  with check (user_id = auth.uid());

create policy "Users can delete their own mutes"
  on mutes for delete
  using (user_id = auth.uid());

create or replace function is_project_muted(check_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from mutes
    where project_id = check_project_id and user_id = auth.uid()
  );
$$;

create or replace function is_column_muted(check_column_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from mutes
    where column_id = check_column_id and user_id = auth.uid()
  )
  or is_project_muted(get_column_project_id(check_column_id));
$$;
