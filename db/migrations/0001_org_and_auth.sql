-- 0001_org_and_auth.sql
-- Organizations + org membership, the multi-tenancy root every other table
-- hangs off via org_id (CLAUDE.md §4).
--
-- Design decision (P4): org bootstrap on signup is implemented as a
-- SECURITY DEFINER RPC function (create_organization), called from a Server
-- Action right after Supabase Auth signup (P5) — NOT an auth.users trigger.
-- A trigger can't distinguish "signing up fresh" from "signing up via an
-- invite token" (P6, org_invites), so that branching has to happen in
-- application code that then calls either create_organization() or
-- accept_org_invite(). The RPC is SECURITY DEFINER specifically to solve the
-- bootstrap chicken-and-egg problem: org_members' own RLS insert policy
-- requires the caller to already be an owner/admin of the org, which is
-- impossible for the very first member.

create extension if not exists "pgcrypto";

create type org_role as enum ('owner', 'admin', 'manager', 'employee');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  org_role org_role not null default 'employee',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index org_members_user_id_idx on org_members (user_id);
create index org_members_org_id_idx on org_members (org_id);

-- ---------------------------------------------------------------------------
-- RLS helper functions (SECURITY DEFINER so they can read org_members
-- without recursively triggering org_members' own RLS policies).
-- ---------------------------------------------------------------------------

create or replace function is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from org_members
    where org_id = check_org_id and user_id = auth.uid()
  );
$$;

create or replace function has_org_role(check_org_id uuid, allowed_roles org_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from org_members
    where org_id = check_org_id
      and user_id = auth.uid()
      and org_role = any (allowed_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table organizations enable row level security;
alter table org_members enable row level security;

create policy "Members can view their org"
  on organizations for select
  using (is_org_member(id));

-- No direct insert policy: organizations are only ever created via the
-- create_organization() SECURITY DEFINER function below.

create policy "Owners/admins can update their org"
  on organizations for update
  using (has_org_role(id, array['owner', 'admin']::org_role[]));

create policy "Members can view their org's membership list"
  on org_members for select
  using (is_org_member(org_id));

create policy "Owners/admins can add members"
  on org_members for insert
  with check (has_org_role(org_id, array['owner', 'admin']::org_role[]));

create policy "Owners/admins can change member roles"
  on org_members for update
  using (has_org_role(org_id, array['owner', 'admin']::org_role[]));

create policy "Owners/admins can remove members"
  on org_members for delete
  using (has_org_role(org_id, array['owner', 'admin']::org_role[]));

-- ---------------------------------------------------------------------------
-- Bootstrap RPC — called once from the Server Action right after a brand new
-- (non-invited) user signs up. Creates the org and makes the caller 'owner'
-- atomically, bypassing the org_members insert policy above (by design).
-- ---------------------------------------------------------------------------

create or replace function create_organization(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'create_organization requires an authenticated user';
  end if;

  insert into organizations (name, created_by)
  values (org_name, auth.uid())
  returning id into new_org_id;

  insert into org_members (org_id, user_id, org_role)
  values (new_org_id, auth.uid(), 'owner');

  return new_org_id;
end;
$$;
