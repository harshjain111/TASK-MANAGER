'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function setEscalationThresholdAction(
  orgId: string,
  hours: number,
): Promise<{ error: string | null }> {
  if (!Number.isFinite(hours) || hours <= 0) {
    return { error: 'Threshold must be a positive number of hours.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ escalation_threshold_hours: Math.round(hours) })
    .eq('id', orgId);

  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { error: null };
}
