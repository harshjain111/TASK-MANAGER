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

-- profiles: mirrors auth.users into a public, PostgREST-embeddable table.
-- Created here (before anything else) because most tables below FK their
-- "who did this" columns to profiles(id) rather than auth.users(id)
-- specifically so `.select('...profiles(full_name, email)')` embeds work —
-- PostgREST only resolves embeds across a REAL foreign key between the two
-- tables in the query; a shared grandparent (both referencing auth.users)
-- does not let it join them to each other. See also 0004's original note
-- (profiles used to live there, before this ordering problem was caught).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

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
  user_id uuid not null references profiles (id) on delete cascade,
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

alter table profiles enable row level security;
alter table organizations enable row level security;
alter table org_members enable row level security;

-- profiles: readable by any authenticated user who shares an org with the
-- profile owner (needed to render names/avatars anywhere in the app);
-- writable only by the profile's own owner. No insert policy — rows are
-- created exclusively by the handle_new_user() trigger above.
create policy "Users can view profiles of their org-mates"
  on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from org_members mine
      join org_members theirs on theirs.org_id = mine.org_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

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
