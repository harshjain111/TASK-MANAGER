'use server';

import { createClient } from '@/lib/supabase/server';
import type { TaskPriority, TaskStatus } from '@/types/domain';

export type HomeTask = {
  id: string;
  title: string;
  dueAt: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  projectName: string;
};

type ProjectRef = { name: string } | null;

export async function getMyTasksInRangeAction(startISO: string, endISO: string): Promise<HomeTask[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('tasks')
      .select(
        'id, title, due_at, status, priority, project_id, projects(name), task_assignees!inner(user_id, is_delegator)',
      )
      .eq('task_assignees.user_id', user.id)
      .eq('task_assignees.is_delegator', false)
      .not('due_at', 'is', null)
      .gte('due_at', startISO)
      .lte('due_at', endISO)
      .is('archived_at', null)
      .order('due_at', { ascending: true });

    return (data ?? []).map((row) => {
      const project = row.projects as unknown as ProjectRef;
      return {
        id: row.id,
        title: row.title,
        dueAt: row.due_at as string,
        status: row.status,
        priority: row.priority,
        projectId: row.project_id,
        projectName: project?.name ?? '',
      };
    });
  } catch {
    return [];
  }
}

export type QuickGlanceCounts = { dueToday: number; overdue: number; urgent: number };

export async function getQuickGlanceCountsAction(): Promise<QuickGlanceCounts> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { dueToday: 0, overdue: 0, urgent: 0 };

    const { data } = await supabase
      .from('tasks')
      .select('due_at, priority, status, task_assignees!inner(user_id, is_delegator)')
      .eq('task_assignees.user_id', user.id)
      .eq('task_assignees.is_delegator', false)
      .is('archived_at', null)
      .neq('status', 'done');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    let dueToday = 0;
    let overdue = 0;
    let urgent = 0;

    for (const row of data ?? []) {
      if (row.priority === 'urgent') urgent += 1;
      if (row.due_at) {
        const due = new Date(row.due_at);
        if (due < todayStart) overdue += 1;
        else if (due >= todayStart && due < todayEnd) dueToday += 1;
      }
    }

    return { dueToday, overdue, urgent };
  } catch {
    return { dueToday: 0, overdue: 0, urgent: 0 };
  }
}
