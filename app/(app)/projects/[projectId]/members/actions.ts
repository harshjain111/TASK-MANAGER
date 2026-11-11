'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ProjectRole } from '@/types/domain';
import { toUserMessage } from '@/lib/utils/action-error';

type ActionResult = { error: string | null };

export async function addProjectMemberAction(
  projectId: string,
  userId: string,
  role: ProjectRole,
  columnIds: string[],
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, project_role: role });
    if (error) return { error: toUserMessage(error) };

    if (role === 'guest' && columnIds.length > 0) {
      const { error: accessError } = await supabase.from('project_column_access').insert(
        columnIds.map((columnId) => ({ project_id: projectId, user_id: userId, column_id: columnId })),
      );
      if (accessError) return { error: toUserMessage(accessError) };
    }

    revalidatePath(`/projects/${projectId}/members`);
    return { error: null };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function removeProjectMemberAction(
  projectId: string,
  memberId: string,
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('project_members').delete().eq('id', memberId);
    if (error) return { error: toUserMessage(error) };

    revalidatePath(`/projects/${projectId}/members`);
    return { error: null };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function setGuestColumnAccessAction(
  projectId: string,
  userId: string,
  columnIds: string[],
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from('project_column_access')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (deleteError) return { error: toUserMessage(deleteError) };

    if (columnIds.length > 0) {
      const { error: insertError } = await supabase.from('project_column_access').insert(
        columnIds.map((columnId) => ({ project_id: projectId, user_id: userId, column_id: columnId })),
      );
      if (insertError) return { error: toUserMessage(insertError) };
    }

    revalidatePath(`/projects/${projectId}/members`);
    return { error: null };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}
