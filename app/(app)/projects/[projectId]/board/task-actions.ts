'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createTaskSchema, quickTaskSchema, type CreateTaskInput, type QuickTaskInput } from '@/lib/validations/task';
import type { TaskStatus } from '@/types/domain';

type ActionResult = { error: string | null; taskId?: string };

async function nextTaskPosition(
  supabase: ReturnType<typeof createClient>,
  columnId: string,
): Promise<number> {
  const { data } = await supabase
    .from('tasks')
    .select('position')
    .eq('column_id', columnId)
    .is('archived_at', null)
    .order('position', { ascending: false })
    .limit(1);
  return (data?.[0]?.position ?? -1) + 1;
}

/** Inserts task_assignees rows, correctly splitting primary/co-actor/delegator
 * per CLAUDE.md §1.3: a delegator who isn't also doing the work gets their
 * own is_delegator=true row so "Delegated Tasks" queries can find it. */
async function insertAssignees(
  supabase: ReturnType<typeof createClient>,
  taskId: string,
  creatorId: string,
  assigneeIds: string[],
) {
  const doers = assigneeIds.length > 0 ? assigneeIds : [creatorId];
  const rows = doers.map((userId, index) => ({
    task_id: taskId,
    user_id: userId,
    is_primary: index === 0,
    is_delegator: false,
  }));

  if (!doers.includes(creatorId)) {
    rows.push({ task_id: taskId, user_id: creatorId, is_primary: false, is_delegator: true });
  }

  const { error } = await supabase.from('task_assignees').insert(rows);
  return error;
}

export async function createQuickTaskAction(
  projectId: string,
  input: QuickTaskInput,
): Promise<ActionResult> {
  const parsed = quickTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const position = await nextTaskPosition(supabase, parsed.data.columnId);

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      column_id: parsed.data.columnId,
      title: parsed.data.title,
      position,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  const assigneeError = await insertAssignees(supabase, task.id, user.id, []);
  if (assigneeError) return { error: assigneeError.message };

  revalidatePath(`/projects/${projectId}/board`);
  return { error: null, taskId: task.id };
}

export async function updateTaskStatusAction(
  projectId: string,
  taskId: string,
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { error } = await supabase.from('tasks').update({ status: toStatus }).eq('id', taskId);
  if (error) return { error: error.message };

  const { data: orgId } = await supabase.rpc('get_project_org_id', { check_project_id: projectId });
  if (orgId) {
    await supabase.from('activity_log').insert({
      org_id: orgId,
      actor_id: user.id,
      entity_type: 'task',
      entity_id: taskId,
      action: 'status_changed',
      metadata: { from: fromStatus, to: toStatus },
    });
  }

  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

/** Persists a drag-and-drop move: sets the moved task's column_id, then
 * renumbers positions in the destination column (and the source column, if
 * different) to match the client's final ordered arrays. */
export async function moveTaskAction(
  projectId: string,
  movedTaskId: string,
  destColumnId: string,
  destOrderedTaskIds: string[],
  sourceColumnId?: string,
  sourceOrderedTaskIds?: string[],
): Promise<ActionResult> {
  const supabase = createClient();

  const { error: columnError } = await supabase
    .from('tasks')
    .update({ column_id: destColumnId })
    .eq('id', movedTaskId);
  if (columnError) return { error: columnError.message };

  const updates = [
    ...destOrderedTaskIds.map((id, position) =>
      supabase.from('tasks').update({ position }).eq('id', id),
    ),
    ...(sourceColumnId && sourceColumnId !== destColumnId
      ? (sourceOrderedTaskIds ?? []).map((id, position) =>
          supabase.from('tasks').update({ position }).eq('id', id),
        )
      : []),
  ];

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function createTaskAction(
  projectId: string,
  input: CreateTaskInput,
): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { columnId, title, description, assigneeIds, dueAt, priority, checklist } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const position = await nextTaskPosition(supabase, columnId);

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      column_id: columnId,
      title,
      description: description || null,
      due_at: dueAt || null,
      priority,
      position,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  const assigneeError = await insertAssignees(supabase, task.id, user.id, assigneeIds);
  if (assigneeError) return { error: assigneeError.message };

  if (checklist.length > 0) {
    const { error: checklistError } = await supabase.from('task_checklist_items').insert(
      checklist.map((label, position) => ({ task_id: task.id, label, position })),
    );
    if (checklistError) return { error: checklistError.message };
  }

  revalidatePath(`/projects/${projectId}/board`);
  return { error: null, taskId: task.id };
}
