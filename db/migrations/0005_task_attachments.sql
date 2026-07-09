-- 0005_task_attachments.sql
--
-- Gap fix: P12's task detail sheet needs "attachments (Supabase Storage
-- upload)" as their own list on the task, separate from the chat/comment
-- thread (P12 explicitly reuses chat_messages only for the comment
-- mini-thread). CLAUDE.md §4's table list never defines where an
-- attachment's metadata (filename, uploader, url) lives — this adds it,
-- plus the Storage bucket + RLS the upload itself needs.

create table task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  uploaded_by uuid not null references auth.users (id),
  file_name text not null,
  file_url text not null,
  file_size integer,
  created_at timestamptz not null default now()
);

create index task_attachments_task_id_idx on task_attachments (task_id);

alter table task_attachments enable row level security;

create policy "Project members can view task attachments"
  on task_attachments for select
  using (is_project_member(get_task_project_id(task_id)));

create policy "Project members can add task attachments"
  on task_attachments for insert
  with check (
    is_project_member(get_task_project_id(task_id)) and uploaded_by = auth.uid()
  );

create policy "Uploader or managers/admins can delete attachments"
  on task_attachments for delete
  using (uploaded_by = auth.uid() or can_manage_project(get_task_project_id(task_id)));

-- ---------------------------------------------------------------------------
-- Storage bucket. Object path convention: `${task_id}/${filename}` — the
-- first path segment is the task id, which the policies below use to reach
-- the same is_project_member() check as everywhere else.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "Project members can read task attachment files"
  on storage.objects for select
  using (
    bucket_id = 'attachments'
    and is_project_member(get_task_project_id(((storage.foldername(name))[1])::uuid))
  );

create policy "Project members can upload task attachment files"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and is_project_member(get_task_project_id(((storage.foldername(name))[1])::uuid))
  );

create policy "Uploader or managers/admins can delete task attachment files"
  on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and (
      owner = auth.uid()
      or can_manage_project(get_task_project_id(((storage.foldername(name))[1])::uuid))
    )
  );
