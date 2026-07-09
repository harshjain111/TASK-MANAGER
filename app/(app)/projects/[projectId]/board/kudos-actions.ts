'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { KudosKind } from '@/types/domain';

type ActionResult = { error: string | null };

export async function giveKudosAction(
  projectId: string,
  taskId: string,
  columnId: string,
  toUserId: string,
  kind: KudosKind,
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be signed in.' };
    if (user.id === toUserId) return { error: "You can't give yourself kudos." };

    const { data: orgId } = await supabase.rpc('get_project_org_id', { check_project_id: projectId });
    if (!orgId) return { error: 'Could not resolve project.' };

    const { error } = await supabase.from('kudos').insert({
      org_id: orgId,
      task_id: taskId,
      from_user_id: user.id,
      to_user_id: toUserId,
      kind,
    });
    if (error) return { error: error.message };

    const { data: task } = await supabase.from('tasks').select('title').eq('id', taskId).maybeSingle();
    const emoji = kind === 'clap' ? '👏' : kind === 'star' ? '⭐' : '🙌';

    await supabase.from('chat_messages').insert({
      column_id: columnId,
      task_id: taskId,
      author_id: user.id,
      body: `${emoji} gave kudos for "${task?.title ?? 'this task'}"`,
      message_type: 'system',
    });

    revalidatePath(`/projects/${projectId}/board`);
    return { error: null };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}
