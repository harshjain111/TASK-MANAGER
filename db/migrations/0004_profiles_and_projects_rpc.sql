-- 0004_profiles_and_projects_rpc.sql
--
-- Gap fix: CLAUDE.md §4's schema never defines a public-facing "who is this
-- user" table. Every RLS-scoped client query is blocked from joining into
-- `auth.users` (not exposed to PostgREST), but P8's "initial members" picker
-- — and P10 avatars, P12's AssigneePicker, P32 Team directory right after —
-- all need to show a name for a user_id. This adds the standard Supabase
-- pattern: a `profiles` table mirrored from auth.users via trigger.
--
-- Also adds create_project(), the same SECURITY DEFINER bootstrap pattern as
-- create_organization() (P4) and accept_org_invite() (P6): the project
-- creator isn't a project_members row yet, so they can't satisfy
-- project_members' own insert policy (0003_projects_boards_tasks.sql).

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  email text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

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

-- No insert policy: rows are created only by the trigger below.

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

-- ---------------------------------------------------------------------------
-- create_project — bootstrap RPC (see header note).
-- ---------------------------------------------------------------------------

create or replace function create_project(
  project_name text,
  project_cover_color text default '#6366F1',
  initial_member_ids uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_project_id uuid;
  caller_org_id uuid;
  member_id uuid;
begin
  if auth.uid() is null then
    raise exception 'create_project requires an authenticated user';
  end if;

  select org_id into caller_org_id from org_members where user_id = auth.uid() limit 1;
  if caller_org_id is null then
    raise exception 'You must belong to an organization to create a project';
  end if;

  if not has_org_role(caller_org_id, array['owner', 'admin', 'manager']::org_role[]) then
    raise exception 'Only owners, admins, or managers can create projects';
  end if;

  insert into projects (org_id, name, cover_color, created_by)
  values (caller_org_id, project_name, coalesce(project_cover_color, '#6366F1'), auth.uid())
  returning id into new_project_id;

  insert into project_members (project_id, user_id, project_role)
  values (new_project_id, auth.uid(), 'manager')
  on conflict (project_id, user_id) do nothing;

  foreach member_id in array initial_member_ids loop
    if member_id <> auth.uid() then
      insert into project_members (project_id, user_id, project_role)
      values (new_project_id, member_id, 'employee')
      on conflict (project_id, user_id) do nothing;
    end if;
  end loop;

  return new_project_id;
end;
$$;
