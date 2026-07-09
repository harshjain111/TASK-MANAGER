import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';
import { Board } from '@/components/board/board';
import type { BoardColumnData } from '@/components/board/board-column';

export default async function BoardPage({ params }: { params: { projectId: string } }) {
  let project: { id: string; name: string; cover_color: string } | null = null;
  let columns: BoardColumnData[] = [];
  let canManage = false;

  try {
    const supabase = createClient();

    const { data: projectRow } = await supabase
      .from('projects')
      .select('id, name, cover_color')
      .eq('id', params.projectId)
      .maybeSingle();
    project = projectRow;

    if (project) {
      const [{ data: columnRows }, { data: taskRows }, membership, { data: projectMember }] =
        await Promise.all([
          supabase
            .from('board_columns')
            .select('id, name, position')
            .eq('project_id', project.id)
            .is('archived_at', null)
            .order('position', { ascending: true }),
          supabase
            .from('tasks')
            .select('column_id, status')
            .eq('project_id', project.id)
            .is('archived_at', null),
          getCurrentOrgMembership(),
          supabase
            .from('project_members')
            .select('project_role')
            .eq('project_id', project.id)
            .maybeSingle(),
        ]);

      const counts = new Map<string, { done: number; total: number }>();
      for (const task of taskRows ?? []) {
        const entry = counts.get(task.column_id) ?? { done: 0, total: 0 };
        entry.total += 1;
        if (task.status === 'done') entry.done += 1;
        counts.set(task.column_id, entry);
      }

      columns = (columnRows ?? []).map((column) => ({
        id: column.id,
        name: column.name,
        position: column.position,
        doneCount: counts.get(column.id)?.done ?? 0,
        totalCount: counts.get(column.id)?.total ?? 0,
      }));

      canManage =
        projectMember?.project_role === 'manager' ||
        (!!membership && ['owner', 'admin'].includes(membership.role));
    }
  } catch {
    project = null;
  }

  if (!project) notFound();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: project.cover_color }}
        >
          {project.name.slice(0, 1).toUpperCase()}
        </span>
        <h1 className="text-sm font-semibold text-foreground">{project.name}</h1>
      </div>
      <div className="min-h-0 flex-1">
        <Board projectId={project.id} columns={columns} canManage={canManage} />
      </div>
    </div>
  );
}
