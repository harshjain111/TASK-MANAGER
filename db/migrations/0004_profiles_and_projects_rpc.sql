-- 0004_profiles_and_projects_rpc.sql
--
-- create_project(): the same SECURITY DEFINER bootstrap pattern as
-- create_organization() (P4) and accept_org_invite() (P6): the project
-- creator isn't a project_members row yet, so they can't satisfy
-- project_members' own insert policy (0003_projects_boards_tasks.sql).
--
-- (`profiles` used to be created in this migration — moved to 0001 so it
-- exists before any table needs to FK to it for PostgREST embedding; see
-- 0001's header comment.)

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
