'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TaskPriority } from '@/types/domain';

type ActionResult = { error: string | null };
type ProfileRef = { full_name: string; email: string } | null;

export type TaskDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: TaskPriority;
  dueAt: string | null;
  columnId: string;
  createdAt: string;
  updatedAt: string;
  assigneeIds: string[];
  checklist: { id: string; label: string; isDone: boolean; position: number }[];
  attachments: { id: string; fileName: string; fileUrl: string; createdAt: string }[];
  comments: { id: string; authorId: string; authorName: string; body: string | null; createdAt: string }[];
};

export async function getTaskDetailAction(taskId: string): Promise<TaskDetail | null> {
  const supabase = createClient();

  const [{ data: task }, { data: assignees }, { data: checklist }, { data: attachments }, { data: comments }] =
    await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, description, status, priority, due_at, column_id, created_at, updated_at')
        .eq('id', taskId)
        .maybeSingle(),
      supabase.from('task_assignees').select('user_id').eq('task_id', taskId).eq('is_delegator', false),
      supabase
        .from('task_checklist_items')
        .select('id, label, is_done, position')
        .eq('task_id', taskId)
        .order('position', { ascending: true }),
      supabase
        .from('task_attachments')
        .select('id, file_name, file_url, created_at')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false }),
      supabase
        .from('chat_messages')
        .select('id, author_id, body, created_at, profiles(full_name, email)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true }),
    ]);

  if (!task) return null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueAt: task.due_at,
    columnId: task.column_id,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    assigneeIds: (assignees ?? []).map((a) => a.user_id),
    checklist: (checklist ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      isDone: c.is_done,
      position: c.position,
    })),
    attachments: (attachments ?? []).map((a) => ({
      id: a.id,
      fileName: a.file_name,
      fileUrl: a.file_url,
      createdAt: a.created_at,
    })),
    comments: (comments ?? []).map((c) => {
      const profile = c.profiles as unknown as ProfileRef;
      return {
        id: c.id,
        authorId: c.author_id,
        authorName: profile?.full_name || profile?.email || 'Unknown',
        body: c.body,
        createdAt: c.created_at,
      };
    }),
  };
}

export async function updateTaskDetailsAction(
  projectId: string,
  taskId: string,
  fields: { description?: string; dueAt?: string | null; priority?: TaskPriority },
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from('tasks')
    .update({
      ...(fields.description !== undefined ? { description: fields.description || null } : {}),
      ...(fields.dueAt !== undefined ? { due_at: fields.dueAt || null } : {}),
      ...(fields.priority !== undefined ? { priority: fields.priority } : {}),
    })
    .eq('id', taskId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function addChecklistItemAction(
  projectId: string,
  taskId: string,
  label: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const { data } = await supabase
    .from('task_checklist_items')
    .select('position')
    .eq('task_id', taskId)
    .order('position', { ascending: false })
    .limit(1);
  const position = (data?.[0]?.position ?? -1) + 1;

  const { error } = await supabase
    .from('task_checklist_items')
    .insert({ task_id: taskId, label, position });

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function toggleChecklistItemAction(
  projectId: string,
  itemId: string,
  isDone: boolean,
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from('task_checklist_items')
    .update({ is_done: isDone })
    .eq('id', itemId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function removeChecklistItemAction(
  projectId: string,
  itemId: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from('task_checklist_items').delete().eq('id', itemId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function reorderChecklistItemsAction(
  projectId: string,
  orderedItemIds: string[],
): Promise<ActionResult> {
  const supabase = createClient();
  const results = await Promise.all(
    orderedItemIds.map((id, position) =>
      supabase.from('task_checklist_items').update({ position }).eq('id', id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function updateAssigneesAction(
  projectId: string,
  taskId: string,
  assigneeIds: string[],
): Promise<ActionResult> {
  const supabase = createClient();

  // Replace the "doer" rows only — leave any is_delegator row untouched.
  const { error: deleteError } = await supabase
    .from('task_assignees')
    .delete()
    .eq('task_id', taskId)
    .eq('is_delegator', false);
  if (deleteError) return { error: deleteError.message };

  if (assigneeIds.length > 0) {
    const { error: insertError } = await supabase.from('task_assignees').insert(
      assigneeIds.map((userId, index) => ({
        task_id: taskId,
        user_id: userId,
        is_primary: index === 0,
        is_delegator: false,
      })),
    );
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function addTaskCommentAction(
  projectId: string,
  taskId: string,
  columnId: string,
  body: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { error } = await supabase.from('chat_messages').insert({
    task_id: taskId,
    column_id: columnId,
    author_id: user.id,
    body,
    message_type: 'text',
  });

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function addTaskAttachmentAction(
  projectId: string,
  taskId: string,
  fileName: string,
  fileUrl: string,
  fileSize: number,
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { error } = await supabase.from('task_attachments').insert({
    task_id: taskId,
    uploaded_by: user.id,
    file_name: fileName,
    file_url: fileUrl,
    file_size: fileSize,
  });

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}
