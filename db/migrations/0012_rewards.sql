-- 0012_rewards.sql
-- Admin-configurable named rewards shown alongside the leaderboard (P29).
-- Text only for v1 — no payment/voucher integration (CLAUDE.md explicit
-- non-goal).

create table rewards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  title text not null,
  description text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create index rewards_org_id_idx on rewards (org_id);

alter table rewards enable row level security;

create policy "Org members can view rewards"
  on rewards for select
  using (is_org_member(org_id));

create policy "Owners/admins can manage rewards (insert)"
  on rewards for insert
  with check (has_org_role(org_id, array['owner', 'admin']::org_role[]));

create policy "Owners/admins can manage rewards (delete)"
  on rewards for delete
  using (has_org_role(org_id, array['owner', 'admin']::org_role[]));
