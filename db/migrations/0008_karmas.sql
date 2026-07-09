-- 0008_karmas.sql
-- Karmas: recurring/ongoing personal duties, independent of a project
-- (CLAUDE.md §1.2, confirmed as a separate table back in 0003's header —
-- not a `tasks` row with an `is_recurring` flag).
--
-- Each row is one occurrence (mirrors how `tasks` works — a due date, a
-- status). `recurrence_type`/`recurrence_interval` describe how to spawn
-- the NEXT occurrence, which happens two ways:
--   1. Completing one (status -> 'done') fires generate_next_karma_occurrence()
--      via trigger, immediately.
--   2. A karma whose due_at has passed with no successor yet needs a
--      scheduled sweep — generate_overdue_karma_occurrences() below is
--      written to be called by a Supabase Edge Function on a cron
--      schedule (pg_cron works too if enabled on the project). Neither can
--      actually be *scheduled* here — that's a deployment-time step
--      against a live project (P38), not something a migration can do.

create type karma_recurrence_type as enum ('daily', 'weekly', 'monthly', 'custom');

create table karmas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  delegated_by uuid references auth.users (id),
  project_id uuid references projects (id) on delete set null,
  title text not null,
  description text,
  recurrence_type karma_recurrence_type not null default 'daily',
  recurrence_interval integer not null default 1,
  recurrence_days_of_week integer[],
  status task_status not null default 'not_started',
  due_at timestamptz not null,
  previous_karma_id uuid references karmas (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint karmas_recurrence_interval_positive check (recurrence_interval > 0)
);

create trigger karmas_set_updated_at
  before update on karmas
  for each row
  execute function set_updated_at();

create index karmas_org_id_idx on karmas (org_id);
create index karmas_user_id_idx on karmas (user_id);
create index karmas_delegated_by_idx on karmas (delegated_by);
create index karmas_due_at_idx on karmas (due_at);

alter table karmas enable row level security;

-- Visible to owner and delegator only (CLAUDE.md P20) — unlike tasks,
-- NOT visible to the whole org or project.
create policy "Owner or delegator can view a karma"
  on karmas for select
  using (user_id = auth.uid() or delegated_by = auth.uid());

create policy "Org members can create karmas for themselves or a delegate"
  on karmas for insert
  with check (
    is_org_member(org_id)
    and (
      (user_id = auth.uid() and delegated_by is null)
      or (delegated_by = auth.uid() and user_id != auth.uid())
    )
  );

create policy "Owner or delegator can update a karma"
  on karmas for update
  using (user_id = auth.uid() or delegated_by = auth.uid());

create policy "Owner or delegator can archive a karma"
  on karmas for delete
  using (user_id = auth.uid() or delegated_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Recurrence engine
-- ---------------------------------------------------------------------------

create or replace function next_karma_due_at(
  current_due timestamptz,
  rec_type karma_recurrence_type,
  rec_interval integer,
  rec_days_of_week integer[]
)
returns timestamptz
language plpgsql
immutable
as $$
declare
  candidate timestamptz;
  dow integer;
begin
  if rec_type = 'weekly' and rec_days_of_week is not null and array_length(rec_days_of_week, 1) > 0 then
    candidate := current_due + interval '1 day';
    for day_offset in 1..14 loop
      dow := extract(dow from candidate)::integer;
      if dow = any(rec_days_of_week) then
        return candidate;
      end if;
      candidate := candidate + interval '1 day';
    end loop;
    return current_due + (rec_interval * interval '1 week');
  elsif rec_type = 'daily' or rec_type = 'custom' then
    return current_due + (rec_interval * interval '1 day');
  elsif rec_type = 'weekly' then
    return current_due + (rec_interval * interval '1 week');
  elsif rec_type = 'monthly' then
    return current_due + (rec_interval * interval '1 month');
  end if;
  return current_due + interval '1 day';
end;
$$;

create or replace function generate_next_karma_occurrence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'done' and old.status != 'done' and new.archived_at is null then
    insert into karmas (
      org_id, user_id, delegated_by, project_id, title, description,
      recurrence_type, recurrence_interval, recurrence_days_of_week,
      status, due_at, previous_karma_id
    )
    select
      new.org_id, new.user_id, new.delegated_by, new.project_id, new.title, new.description,
      new.recurrence_type, new.recurrence_interval, new.recurrence_days_of_week,
      'not_started', next_karma_due_at(new.due_at, new.recurrence_type, new.recurrence_interval, new.recurrence_days_of_week),
      new.id
    where not exists (select 1 from karmas where previous_karma_id = new.id);
  end if;
  return new;
end;
$$;

create trigger karmas_generate_next_occurrence
  after update on karmas
  for each row
  execute function generate_next_karma_occurrence();

-- Sweep for karmas whose due date has passed with no successor yet —
-- call on a schedule (Edge Function / pg_cron) once deployed; see header.
create or replace function generate_overdue_karma_occurrences()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_count integer := 0;
  karma_row karmas%rowtype;
begin
  for karma_row in
    select * from karmas k
    where k.due_at < now()
      and k.archived_at is null
      and k.status != 'done'
      and not exists (select 1 from karmas where previous_karma_id = k.id)
  loop
    insert into karmas (
      org_id, user_id, delegated_by, project_id, title, description,
      recurrence_type, recurrence_interval, recurrence_days_of_week,
      status, due_at, previous_karma_id
    )
    values (
      karma_row.org_id, karma_row.user_id, karma_row.delegated_by, karma_row.project_id,
      karma_row.title, karma_row.description,
      karma_row.recurrence_type, karma_row.recurrence_interval, karma_row.recurrence_days_of_week,
      'not_started',
      next_karma_due_at(karma_row.due_at, karma_row.recurrence_type, karma_row.recurrence_interval, karma_row.recurrence_days_of_week),
      karma_row.id
    );
    generated_count := generated_count + 1;
  end loop;
  return generated_count;
end;
$$;
