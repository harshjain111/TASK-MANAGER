'use server';

import { createClient } from '@/lib/supabase/server';
import type { TaskPriority, TaskStatus } from '@/types/domain';
import type { MyTaskTab, DelegatedTaskTab } from '@/lib/home-tabs';

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

export type PanelTask = {
  id: string;
  title: string;
  dueAt: string | null;
  status: TaskStatus;
  projectId: string;
  assigneeId: string;
  assigneeName: string;
};

type AssigneeRef = { full_name: string; email: string } | null;

/** Shared row-shape fetch for the Home 2x2 grid (CLAUDE.md §1.3). `scope`
 * picks the task_assignees role (doer vs delegator); `tab` narrows further. */
export async function getHomeTaskPanelAction(
  scope: 'my' | 'delegated',
  tab: MyTaskTab | DelegatedTaskTab,
): Promise<PanelTask[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('tasks')
      .select(
        'id, title, due_at, status, project_id, task_assignees!inner(user_id, is_delegator, is_primary)',
      )
      .eq('task_assignees.user_id', user.id)
      .eq('task_assignees.is_delegator', scope === 'delegated')
      .is('archived_at', null);

    const now = new Date().toISOString();
    const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (tab === 'Due Soon') {
      query = query.not('due_at', 'is', null).gte('due_at', now).lte('due_at', sevenDaysOut).neq('status', 'done');
    } else if (tab === 'Overdue') {
      query = query.not('due_at', 'is', null).lt('due_at', now).neq('status', 'done');
    } else if (tab === 'Stuck') {
      query = query.eq('status', 'stuck');
    } else if (tab === 'Review') {
      query = query.eq('status', 'review');
    } else if (tab === 'Co-act') {
      query = query.eq('task_assignees.is_primary', false).neq('status', 'done');
    }

    const { data } = await query.order('due_at', { ascending: true, nullsFirst: false });
    const tasks = data ?? [];
    if (tasks.length === 0) return [];

    const taskIds = tasks.map((t) => t.id);
    const { data: primaryAssignees } = await supabase
      .from('task_assignees')
      .select('task_id, user_id, profiles(full_name, email)')
      .in('task_id', taskIds)
      .eq('is_primary', true);

    const primaryByTask = new Map<string, { id: string; name: string }>();
    for (const row of primaryAssignees ?? []) {
      const profile = row.profiles as unknown as AssigneeRef;
      primaryByTask.set(row.task_id, {
        id: row.user_id,
        name: profile?.full_name || profile?.email || 'Unknown',
      });
    }

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueAt: task.due_at,
      status: task.status,
      projectId: task.project_id,
      assigneeId: primaryByTask.get(task.id)?.id ?? user.id,
      assigneeName: primaryByTask.get(task.id)?.name ?? 'Unknown',
    }));
  } catch {
    return [];
  }
}
