'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ProjectRole } from '@/types/domain';

type ActionResult = { error: string | null };

export async function addProjectMemberAction(
  projectId: string,
  userId: string,
  role: ProjectRole,
  columnIds: string[],
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId, project_role: role });
  if (error) return { error: error.message };

  if (role === 'guest' && columnIds.length > 0) {
    const { error: accessError } = await supabase.from('project_column_access').insert(
      columnIds.map((columnId) => ({ project_id: projectId, user_id: userId, column_id: columnId })),
    );
    if (accessError) return { error: accessError.message };
  }

  revalidatePath(`/projects/${projectId}/members`);
  return { error: null };
}

export async function removeProjectMemberAction(
  projectId: string,
  memberId: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from('project_members').delete().eq('id', memberId);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/members`);
  return { error: null };
}

export async function setGuestColumnAccessAction(
  projectId: string,
  userId: string,
  columnIds: string[],
): Promise<ActionResult> {
  const supabase = createClient();

  const { error: deleteError } = await supabase
    .from('project_column_access')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (deleteError) return { error: deleteError.message };

  if (columnIds.length > 0) {
    const { error: insertError } = await supabase.from('project_column_access').insert(
      columnIds.map((columnId) => ({ project_id: projectId, user_id: userId, column_id: columnId })),
    );
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/projects/${projectId}/members`);
  return { error: null };
}
