'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { columnNameSchema } from '@/lib/validations/board';

type ActionResult = { error: string | null };

export async function createColumnAction(projectId: string, name: string): Promise<ActionResult> {
  const parsed = columnNameSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from('board_columns')
    .select('position')
    .eq('project_id', projectId)
    .is('archived_at', null)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { error } = await supabase
    .from('board_columns')
    .insert({ project_id: projectId, name: parsed.data.name, position: nextPosition });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function renameColumnAction(
  projectId: string,
  columnId: string,
  name: string,
): Promise<ActionResult> {
  const parsed = columnNameSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('board_columns')
    .update({ name: parsed.data.name })
    .eq('id', columnId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function archiveColumnAction(
  projectId: string,
  columnId: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from('board_columns')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', columnId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}

export async function reorderColumnsAction(
  projectId: string,
  orderedColumnIds: string[],
): Promise<ActionResult> {
  const supabase = createClient();

  const results = await Promise.all(
    orderedColumnIds.map((id, position) =>
      supabase.from('board_columns').update({ position }).eq('id', id),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath(`/projects/${projectId}/board`);
  return { error: null };
}
