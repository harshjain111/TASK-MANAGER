-- 0013_guest_vendor_role.sql
-- Guest/Vendor role (P30, CLAUDE.md §1.4.4): restricted to specific board
-- columns (not the whole project), and within those columns can only
-- view/update tasks assigned to them. Regular project members (manager/
-- employee) are unaffected — this migration only narrows what a
-- project_role='guest' member can see.

create table project_column_access (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  column_id uuid not null references board_columns (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, column_id)
);

create index project_column_access_user_id_idx on project_column_access (user_id);
create index project_column_access_column_id_idx on project_column_access (column_id);

alter table project_column_access enable row level security;

create policy "Managers/org admins can view column access grants"
  on project_column_access for select
  using (can_manage_project(project_id) or user_id = auth.uid());

create policy "Managers/org admins can grant column access"
  on project_column_access for insert
  with check (can_manage_project(project_id));

create policy "Managers/org admins can revoke column access"
  on project_column_access for delete
  using (can_manage_project(project_id));

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function is_project_guest(check_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from project_members
    where project_id = check_project_id and user_id = auth.uid() and project_role = 'guest'
  );
$$;

create or replace function can_view_column(check_column_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    is_project_member(get_column_project_id(check_column_id))
    and (
      not is_project_guest(get_column_project_id(check_column_id))
      or exists (
        select 1 from project_column_access
        where column_id = check_column_id and user_id = auth.uid()
      )
    );
$$;

-- ---------------------------------------------------------------------------
-- Tighten existing policies for the guest case. Non-guest members see no
-- behavior change — can_view_column()/the task_assignees check below both
-- reduce to the original is_project_member() check when the caller isn't a
-- guest in that project.
-- ---------------------------------------------------------------------------

drop policy "Project members can view columns" on board_columns;
create policy "Project members can view columns"
  on board_columns for select
  using (can_view_column(id));

drop policy "Project members can view tasks" on tasks;
create policy "Project members can view tasks"
  on tasks for select
  using (
    can_view_column(column_id)
    and (
      not is_project_guest(project_id)
      or exists (select 1 from task_assignees where task_id = tasks.id and user_id = auth.uid())
    )
  );

drop policy "Project members can update tasks" on tasks;
create policy "Project members can update tasks"
  on tasks for update
  using (
    can_view_column(column_id)
    and (
      not is_project_guest(project_id)
      or exists (select 1 from task_assignees where task_id = tasks.id and user_id = auth.uid())
    )
  );

drop policy "Project members can view messages" on chat_messages;
create policy "Project members can view messages"
  on chat_messages for select
  using (can_view_column(column_id));

drop policy "Project members can post messages" on chat_messages;
create policy "Project members can post messages"
  on chat_messages for insert
  with check (can_view_column(column_id) and author_id = auth.uid());

drop policy "Project members can view assignees" on task_assignees;
create policy "Project members can view assignees"
  on task_assignees for select
  using (
    is_project_member(get_task_project_id(task_id))
    and (
      not is_project_guest(get_task_project_id(task_id))
      or user_id = auth.uid()
    )
  );

drop policy "Project members can view checklist items" on task_checklist_items;
create policy "Project members can view checklist items"
  on task_checklist_items for select
  using (
    is_project_member(get_task_project_id(task_id))
    and (
      not is_project_guest(get_task_project_id(task_id))
      or exists (
        select 1 from task_assignees
        where task_id = task_checklist_items.task_id and user_id = auth.uid()
      )
    )
  );
