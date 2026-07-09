-- 0006_chat_attachments_bucket.sql
--
-- Storage bucket for column chat photo/file uploads (P16). Separate from
-- the 0005 `attachments` bucket (task-scoped path convention
-- `${task_id}/...`) because chat uploads are column-scoped
-- (`${column_id}/...`) — the RLS policies key off different first-path-
-- segment lookups (get_column_project_id vs get_task_project_id).

insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

create policy "Project members can read chat attachment files"
  on storage.objects for select
  using (
    bucket_id = 'chat-attachments'
    and is_project_member(get_column_project_id(((storage.foldername(name))[1])::uuid))
  );

create policy "Project members can upload chat attachment files"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and is_project_member(get_column_project_id(((storage.foldername(name))[1])::uuid))
  );

create policy "Uploader or managers/admins can delete chat attachment files"
  on storage.objects for delete
  using (
    bucket_id = 'chat-attachments'
    and (
      owner = auth.uid()
      or can_manage_project(get_column_project_id(((storage.foldername(name))[1])::uuid))
    )
  );
