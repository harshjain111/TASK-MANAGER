'use server';

import { createClient } from '@/lib/supabase/server';

export type MuteState = { projectMuted: boolean; mutedColumnIds: string[] };

export async function getMuteStateAction(projectId: string): Promise<MuteState> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { projectMuted: false, mutedColumnIds: [] };

    const { data } = await supabase
      .from('mutes')
      .select('project_id, column_id')
      .eq('user_id', user.id);

    return {
      projectMuted: (data ?? []).some((m) => m.project_id === projectId),
      mutedColumnIds: (data ?? []).filter((m) => m.column_id).map((m) => m.column_id as string),
    };
  } catch {
    return { projectMuted: false, mutedColumnIds: [] };
  }
}

export async function toggleProjectMuteAction(projectId: string): Promise<{ muted: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { muted: false };

  const { data: existing } = await supabase
    .from('mutes')
    .select('id')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) {
    await supabase.from('mutes').delete().eq('id', existing.id);
    return { muted: false };
  }

  await supabase.from('mutes').insert({ user_id: user.id, project_id: projectId });
  return { muted: true };
}

export async function toggleColumnMuteAction(columnId: string): Promise<{ muted: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { muted: false };

  const { data: existing } = await supabase
    .from('mutes')
    .select('id')
    .eq('user_id', user.id)
    .eq('column_id', columnId)
    .maybeSingle();

  if (existing) {
    await supabase.from('mutes').delete().eq('id', existing.id);
    return { muted: false };
  }

  await supabase.from('mutes').insert({ user_id: user.id, column_id: columnId });
  return { muted: true };
}
