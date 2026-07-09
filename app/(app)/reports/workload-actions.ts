'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';

export type WorkloadRow = { userId: string; name: string; count: number; flagged: boolean };

function rangeForCurrentWeek() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function flagOutliers(counts: { userId: string; name: string; count: number }[]): WorkloadRow[] {
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  const avg = counts.length > 0 ? total / counts.length : 0;
  return counts.map((c) => ({
    ...c,
    flagged: c.count >= 3 && c.count > avg * 1.5,
  }));
}

type ProfileRef = { full_name: string; email: string } | null;

export async function getWorkloadAction(
  scope: { type: 'project'; projectId: string } | { type: 'org' },
): Promise<WorkloadRow[]> {
  try {
    const supabase = createClient();
    const { start, end } = rangeForCurrentWeek();

    let query = supabase
      .from('tasks')
      .select(
        'project_id, task_assignees!inner(user_id, is_delegator, profiles(full_name, email)), projects!inner(org_id)',
      )
      .eq('task_assignees.is_delegator', false)
      .neq('status', 'done')
      .is('archived_at', null)
      .not('due_at', 'is', null)
      .gte('due_at', start)
      .lt('due_at', end);

    if (scope.type === 'project') {
      query = query.eq('project_id', scope.projectId);
    } else {
      const membership = await getCurrentOrgMembership();
      if (!membership || !['owner', 'admin'].includes(membership.role)) return [];
      query = query.eq('projects.org_id', membership.orgId);
    }

    const { data } = await query;

    const countByUser = new Map<string, { name: string; count: number }>();
    for (const row of data ?? []) {
      const assignees = row.task_assignees as unknown as {
        user_id: string;
        profiles: ProfileRef;
      }[];
      for (const a of assignees) {
        const existing = countByUser.get(a.user_id);
        const name = a.profiles?.full_name || a.profiles?.email || 'Unknown';
        countByUser.set(a.user_id, { name, count: (existing?.count ?? 0) + 1 });
      }
    }

    const counts = Array.from(countByUser.entries()).map(([userId, v]) => ({ userId, ...v }));
    counts.sort((a, b) => b.count - a.count);
    return flagOutliers(counts);
  } catch {
    return [];
  }
}
