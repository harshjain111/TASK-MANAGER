import { createClient } from '@/lib/supabase/server';

export type ProjectHealth = {
  projectId: string;
  projectName: string;
  coverColor: string;
  counts: Record<'not_started' | 'in_progress' | 'stuck' | 'done' | 'review', number>;
  overdueCount: number;
  onTimeRate: number | null; // null = no completions in the last 30 days to measure
  tone: 'gray' | 'blue' | 'amber' | 'green';
};

/** Not a Server Action (no 'use server' — this is only ever called from the
 * /reports Server Component, so a plain async function is simpler). */
export async function getProjectHealth(): Promise<ProjectHealth[]> {
  try {
    const supabase = createClient();
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, cover_color')
      .is('archived_at', null);
    if (!projects || projects.length === 0) return [];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const results = await Promise.all(
      projects.map(async (project) => {
        const [{ data: tasks }, { data: recentlyDone }] = await Promise.all([
          supabase
            .from('tasks')
            .select('status, due_at')
            .eq('project_id', project.id)
            .is('archived_at', null),
          supabase
            .from('tasks')
            .select('due_at, updated_at')
            .eq('project_id', project.id)
            .eq('status', 'done')
            .gte('updated_at', thirtyDaysAgo)
            .is('archived_at', null),
        ]);

        const counts = { not_started: 0, in_progress: 0, stuck: 0, done: 0, review: 0 };
        let overdueCount = 0;
        for (const t of tasks ?? []) {
          counts[t.status] += 1;
          if (t.due_at && t.due_at < now && t.status !== 'done') overdueCount += 1;
        }

        let onTimeRate: number | null = null;
        if (recentlyDone && recentlyDone.length > 0) {
          const onTime = recentlyDone.filter((t) => !t.due_at || t.updated_at <= t.due_at).length;
          onTimeRate = Math.round((onTime / recentlyDone.length) * 100);
        }

        const total = tasks?.length ?? 0;
        let tone: ProjectHealth['tone'] = 'gray';
        if (overdueCount > 0) tone = 'amber';
        else if (total > 0 && counts.done === total) tone = 'green';
        else if (counts.in_progress > 0 || counts.review > 0) tone = 'blue';

        return {
          projectId: project.id,
          projectName: project.name,
          coverColor: project.cover_color,
          counts,
          overdueCount,
          onTimeRate,
          tone,
        };
      }),
    );

    return results;
  } catch {
    return [];
  }
}
