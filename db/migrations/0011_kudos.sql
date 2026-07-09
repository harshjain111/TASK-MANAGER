-- 0011_kudos.sql
-- Lightweight kudos/points (P27-P29) — recognition tied to task completion,
-- not present in KarmaAxis at all (CLAUDE.md §1.4.3).

create type kudos_kind as enum ('clap', 'star', 'team');

create table kudos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  task_id uuid references tasks (id) on delete set null,
  from_user_id uuid not null references profiles (id),
  to_user_id uuid not null references profiles (id),
  kind kudos_kind not null default 'clap',
  created_at timestamptz not null default now(),
  constraint kudos_not_self check (from_user_id != to_user_id)
);

create index kudos_org_id_idx on kudos (org_id);
create index kudos_to_user_id_idx on kudos (to_user_id);
create index kudos_task_id_idx on kudos (task_id);

alter table kudos enable row level security;

create policy "Org members can view kudos"
  on kudos for select
  using (is_org_member(org_id));

create policy "Org members can give kudos"
  on kudos for insert
  with check (is_org_member(org_id) and from_user_id = auth.uid());

create policy "Givers can revoke their own kudos"
  on kudos for delete
  using (from_user_id = auth.uid());
