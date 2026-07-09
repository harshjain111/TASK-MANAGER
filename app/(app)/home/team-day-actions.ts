'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';

export async function isManagerAction(): Promise<boolean> {
  try {
    const membership = await getCurrentOrgMembership();
    if (!membership) return false;
    if (['owner', 'admin'].includes(membership.role)) return true;

    const supabase = createClient();
    const { data } = await supabase
      .from('project_members')
      .select('id')
      .eq('user_id', membership.userId)
      .eq('project_role', 'manager')
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export type TeamDayMember = {
  userId: string;
  name: string;
  tasks: { id: string; title: string; status: string; projectId: string }[];
};

type ProfileRef = { full_name: string; email: string } | null;

export async function getTeamDayAction(dateISO: string): Promise<TeamDayMember[]> {
  try {
    const membership = await getCurrentOrgMembership();
    if (!membership) return [];

    const supabase = createClient();
    const dayStart = new Date(dateISO);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const [{ data: members }, { data: tasks }] = await Promise.all([
      supabase
        .from('org_members')
        .select('user_id, profiles(full_name, email)')
        .eq('org_id', membership.orgId),
      supabase
        .from('tasks')
        .select(
          'id, title, status, project_id, projects!inner(org_id), task_assignees!inner(user_id, is_delegator)',
        )
        .eq('projects.org_id', membership.orgId)
        .eq('task_assignees.is_delegator', false)
        .not('due_at', 'is', null)
        .gte('due_at', dayStart.toISOString())
        .lt('due_at', dayEnd.toISOString())
        .is('archived_at', null),
    ]);

    const tasksByUser = new Map<string, TeamDayMember['tasks']>();
    for (const row of tasks ?? []) {
      const assignees = row.task_assignees as unknown as { user_id: string }[];
      for (const a of assignees) {
        const list = tasksByUser.get(a.user_id) ?? [];
        list.push({ id: row.id, title: row.title, status: row.status, projectId: row.project_id });
        tasksByUser.set(a.user_id, list);
      }
    }

    return (members ?? []).map((m) => {
      const profile = m.profiles as unknown as ProfileRef;
      return {
        userId: m.user_id,
        name: profile?.full_name || profile?.email || 'Unknown',
        tasks: tasksByUser.get(m.user_id) ?? [],
      };
    });
  } catch {
    return [];
  }
}
