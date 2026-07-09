import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export type DigestCounts = { tasksToday: number; karmasToday: number; overdue: number };

/** Counts due-today/overdue tasks and karmas for one user within one org.
 * Shared by the daily digest (P22) and, later, escalation alerts (P23). */
export async function getDigestCounts(
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId: string,
): Promise<DigestCounts> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const [{ data: tasks }, { data: karmas }] = await Promise.all([
    supabase
      .from('tasks')
      .select('due_at, status, project_id, projects!inner(org_id), task_assignees!inner(user_id, is_delegator)')
      .eq('projects.org_id', orgId)
      .eq('task_assignees.user_id', userId)
      .eq('task_assignees.is_delegator', false)
      .not('due_at', 'is', null)
      .neq('status', 'done')
      .is('archived_at', null),
    supabase
      .from('karmas')
      .select('due_at, status')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .neq('status', 'done')
      .is('archived_at', null),
  ]);

  let tasksToday = 0;
  let karmasToday = 0;
  let overdue = 0;

  for (const t of tasks ?? []) {
    if (!t.due_at) continue;
    if (t.due_at < todayStart) overdue += 1;
    else if (t.due_at >= todayStart && t.due_at < todayEnd) tasksToday += 1;
  }
  for (const k of karmas ?? []) {
    if (k.due_at < todayStart) overdue += 1;
    else if (k.due_at >= todayStart && k.due_at < todayEnd) karmasToday += 1;
  }

  return { tasksToday, karmasToday, overdue };
}
