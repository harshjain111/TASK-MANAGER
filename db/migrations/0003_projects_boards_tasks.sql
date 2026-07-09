-- 0003_projects_boards_tasks.sql
-- Projects, board columns (sub-projects), tasks, and the supporting tables
-- Phase 1 UI needs even though their own prompts land later (CLAUDE.md §4):
--   - activity_log   — P11 (inline status updates) writes to it on every change
--   - chat_messages  — P12's task detail sheet reads a task-scoped mini-thread
--                       from it (`filtered by task_id`); the full column chat
--                       drawer is P16, but the table has to exist before then
--   - notifications  — P15 (basic notifications) reads/writes it
-- Scope note: the P7 prompt text names only projects/board_columns/tasks/
-- task_assignees/task_checklist_items, but three later Phase 1 prompts
-- reference tables the playbook never schedules a migration for. Rather than
-- have P11/P12/P15 silently bolt on ad-hoc migrations, this file lays down
-- every v1 core table from CLAUDE.md §4 except `karmas` (explicitly deferred
-- to P20) and `kudos` (Phase 3, P27).
--
-- Karma-vs-Task decision (CLAUDE.md §4, confirmed here per that section's
-- instruction to confirm in the first migration that defines `tasks`):
-- Karma stays a SEPARATE table (built in P20), not a `tasks` row with an
-- `is_recurring`/`is_karma` flag. `tasks` below has no such column by design.

create type project_role as enum ('manager', 'employee', 'guest');
create type task_status as enum ('not_started', 'in_progress', 'stuck', 'done', 'review');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type message_type as enum ('text', 'photo', 'file', 'system');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  cover_color text not null default '#6366F1',
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  project_role project_role not null default 'employee',
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table board_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  is_default boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  column_id uuid not null references board_columns (id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'not_started',
  priority task_priority not null default 'medium',
  due_at timestamptz,
  position integer not null default 0,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create trigger tasks_set_updated_at
  before update on tasks
  for each row
  execute function set_updated_at();

create table task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  is_primary boolean not null default true,
  is_delegator boolean not null default false,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create table task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references board_columns (id) on delete cascade,
  task_id uuid references tasks (id) on delete set null,
  author_id uuid not null references auth.users (id),
  body text,
  attachment_url text,
  message_type message_type not null default 'text',
  created_at timestamptz not null default now()
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  actor_id uuid not null references auth.users (id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index projects_org_id_idx on projects (org_id);
create index project_members_project_id_idx on project_members (project_id);
create index project_members_user_id_idx on project_members (user_id);
create index board_columns_project_id_idx on board_columns (project_id);
create index tasks_project_id_idx on tasks (project_id);
create index tasks_column_id_idx on tasks (column_id);
create index task_assignees_task_id_idx on task_assignees (task_id);
create index task_assignees_user_id_idx on task_assignees (user_id);
create index task_checklist_items_task_id_idx on task_checklist_items (task_id);
create index chat_messages_column_id_idx on chat_messages (column_id);
create index chat_messages_task_id_idx on chat_messages (task_id);
create index activity_log_org_id_idx on activity_log (org_id);
create index activity_log_entity_idx on activity_log (entity_type, entity_id);
create index notifications_user_id_idx on notifications (user_id);

-- ---------------------------------------------------------------------------
-- RLS helper functions — SECURITY DEFINER to avoid recursive RLS when one
-- table's policy needs to check membership/ownership through another table.
-- ---------------------------------------------------------------------------

create or replace function is_project_member(check_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from project_members
    where project_id = check_project_id and user_id = auth.uid()
  );
$$;

create or replace function has_project_role(check_project_id uuid, allowed_roles project_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from project_members
    where project_id = check_project_id
      and user_id = auth.uid()
      and project_role = any (allowed_roles)
  );
$$;

create or replace function get_project_org_id(check_project_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select org_id from projects where id = check_project_id;
$$;

create or replace function get_task_project_id(check_task_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select project_id from tasks where id = check_task_id;
$$;

create or replace function get_column_project_id(check_column_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select project_id from board_columns where id = check_column_id;
$$;

-- A user manages a project if they're that project's manager, or an
-- owner/admin of the org it belongs to.
create or replace function can_manage_project(check_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select has_project_role(check_project_id, array['manager']::project_role[])
      or has_org_role(get_project_org_id(check_project_id), array['owner', 'admin']::org_role[]);
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table projects enable row level security;
alter table project_members enable row level security;
alter table board_columns enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table task_checklist_items enable row level security;
alter table chat_messages enable row level security;
alter table activity_log enable row level security;
alter table notifications enable row level security;

-- projects: visible to project members, plus org owners/admins for oversight.
create policy "Members and org admins can view projects"
  on projects for select
  using (is_project_member(id) or has_org_role(org_id, array['owner', 'admin']::org_role[]));

create policy "Managers/admins/owners can create projects"
  on projects for insert
  with check (has_org_role(org_id, array['owner', 'admin', 'manager']::org_role[]));

create policy "Project managers or org admins can update projects"
  on projects for update
  using (can_manage_project(id));

-- project_members
create policy "Members and org admins can view project membership"
  on project_members for select
  using (
    is_project_member(project_id)
    or has_org_role(get_project_org_id(project_id), array['owner', 'admin']::org_role[])
  );

create policy "Managers/org admins can add project members"
  on project_members for insert
  with check (can_manage_project(project_id));

create policy "Managers/org admins can change project member roles"
  on project_members for update
  using (can_manage_project(project_id));

create policy "Managers/org admins can remove project members"
  on project_members for delete
  using (can_manage_project(project_id));

-- board_columns
create policy "Project members can view columns"
  on board_columns for select
  using (is_project_member(project_id));

create policy "Managers/org admins can manage columns (insert)"
  on board_columns for insert
  with check (can_manage_project(project_id));

create policy "Managers/org admins can manage columns (update)"
  on board_columns for update
  using (can_manage_project(project_id));

create policy "Managers/org admins can manage columns (delete)"
  on board_columns for delete
  using (can_manage_project(project_id));

-- tasks: any project member can create/update (assign, change status, edit);
-- deleting (archiving) is manager/admin-only, matching KarmaAxis's model
-- where staff self-serve task work but can't remove work from the board.
create policy "Project members can view tasks"
  on tasks for select
  using (is_project_member(project_id));

create policy "Project members can create tasks"
  on tasks for insert
  with check (is_project_member(project_id));

create policy "Project members can update tasks"
  on tasks for update
  using (is_project_member(project_id));

create policy "Managers/org admins can delete tasks"
  on tasks for delete
  using (can_manage_project(project_id));

-- task_assignees
create policy "Project members can view assignees"
  on task_assignees for select
  using (is_project_member(get_task_project_id(task_id)));

create policy "Project members can manage assignees (insert)"
  on task_assignees for insert
  with check (is_project_member(get_task_project_id(task_id)));

create policy "Project members can manage assignees (update)"
  on task_assignees for update
  using (is_project_member(get_task_project_id(task_id)));

create policy "Project members can manage assignees (delete)"
  on task_assignees for delete
  using (is_project_member(get_task_project_id(task_id)));

-- task_checklist_items
create policy "Project members can view checklist items"
  on task_checklist_items for select
  using (is_project_member(get_task_project_id(task_id)));

create policy "Project members can manage checklist items (insert)"
  on task_checklist_items for insert
  with check (is_project_member(get_task_project_id(task_id)));

create policy "Project members can manage checklist items (update)"
  on task_checklist_items for update
  using (is_project_member(get_task_project_id(task_id)));

create policy "Project members can manage checklist items (delete)"
  on task_checklist_items for delete
  using (is_project_member(get_task_project_id(task_id)));

-- chat_messages: any project member can read/post; only the author (or a
-- manager/admin, for moderation) can edit/delete a message.
create policy "Project members can view messages"
  on chat_messages for select
  using (is_project_member(get_column_project_id(column_id)));

create policy "Project members can post messages"
  on chat_messages for insert
  with check (
    is_project_member(get_column_project_id(column_id)) and author_id = auth.uid()
  );

create policy "Authors or managers/admins can edit messages"
  on chat_messages for update
  using (author_id = auth.uid() or can_manage_project(get_column_project_id(column_id)));

create policy "Authors or managers/admins can delete messages"
  on chat_messages for delete
  using (author_id = auth.uid() or can_manage_project(get_column_project_id(column_id)));

-- activity_log: an org-wide, immutable audit trail (no update/delete
-- policies at all — even owners can't edit history through the API).
create policy "Org members can view activity"
  on activity_log for select
  using (is_org_member(org_id));

create policy "Org members can write activity"
  on activity_log for insert
  with check (is_org_member(org_id) and actor_id = auth.uid());

-- notifications: strictly per-user. Any org member can create a notification
-- *for* a teammate (assignment, @mention, approval) — the insert check only
-- requires the target user share the caller's org, not that the caller is
-- the recipient.
create policy "Users can view their own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "Org members can create notifications for teammates"
  on notifications for insert
  with check (is_org_member(org_id));

create policy "Users can mark their own notifications read"
  on notifications for update
  using (user_id = auth.uid());
