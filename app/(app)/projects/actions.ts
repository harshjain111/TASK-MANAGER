'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createProjectSchema, type CreateProjectInput } from '@/lib/validations/project';

type ActionResult = { error: string | null; projectId?: string };

export async function createProjectAction(input: CreateProjectInput): Promise<ActionResult> {
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_project', {
    project_name: parsed.data.name,
    project_cover_color: parsed.data.coverColor,
    initial_member_ids: parsed.data.memberIds,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/projects');
  return { error: null, projectId: data };
}
