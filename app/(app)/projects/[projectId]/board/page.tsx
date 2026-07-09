import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';
import { Board } from '@/components/board/board';
import { ProjectMuteToggle } from '@/components/board/project-mute-toggle';
import type { BoardColumnData } from '@/components/board/board-column';
import type { TaskCardData } from '@/components/tasks/task-card';
import type { PickableMember } from '@/components/tasks/assignee-picker';
import type { TaskStatus } from '@/types/domain';

type ProfileRef = { full_name: string; email: string } | null;

export default async function BoardPage({ params }: { params: { projectId: string } }) {
  let project: { id: string; name: string; cover_color: string } | null = null;
  let columns: BoardColumnData[] = [];
  let tasksByColumn: Record<string, TaskCardData[]> = {};
  let members: PickableMember[] = [];
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
      const [
        { data: columnRows },
        { data: taskRows },
        { data: assigneeRows },
        { data: checklistRows },
        { data: memberRows },
        { data: messageRows },
        { data: kudosRows },
        membership,
        { data: projectMember },
      ] = await Promise.all([
        supabase
          .from('board_columns')
          .select('id, name, position')
          .eq('project_id', project.id)
          .is('archived_at', null)
          .order('position', { ascending: true }),
        supabase
          .from('tasks')
          .select('id, column_id, title, status, position, created_at, updated_at')
          .eq('project_id', project.id)
          .is('archived_at', null)
          .order('position', { ascending: true }),
        supabase
          .from('task_assignees')
          .select('task_id, user_id, is_delegator, profiles(full_name, email), tasks!inner(project_id)')
          .eq('tasks.project_id', project.id)
          .eq('is_delegator', false),
        supabase
          .from('task_checklist_items')
          .select('task_id, is_done, tasks!inner(project_id)')
          .eq('tasks.project_id', project.id),
        supabase
          .from('project_members')
          .select('user_id, profiles(full_name, email)')
          .eq('project_id', project.id),
        supabase
          .from('chat_messages')
          .select('task_id, board_columns!inner(project_id)')
          .eq('board_columns.project_id', project.id)
          .not('task_id', 'is', null),
        supabase
          .from('kudos')
          .select('task_id, tasks!inner(project_id)')
          .eq('tasks.project_id', project.id),
        getCurrentOrgMembership(),
        supabase
          .from('project_members')
          .select('project_role')
          .eq('project_id', project.id)
          .maybeSingle(),
      ]);

      const assigneesByTask = new Map<string, { userId: string; name: string }[]>();
      for (const row of assigneeRows ?? []) {
        const profile = row.profiles as unknown as ProfileRef;
        const list = assigneesByTask.get(row.task_id) ?? [];
        list.push({ userId: row.user_id, name: profile?.full_name || profile?.email || 'Unknown' });
        assigneesByTask.set(row.task_id, list);
      }

      const checklistByTask = new Map<string, { done: number; total: number }>();
      for (const row of checklistRows ?? []) {
        const entry = checklistByTask.get(row.task_id) ?? { done: 0, total: 0 };
        entry.total += 1;
        if (row.is_done) entry.done += 1;
        checklistByTask.set(row.task_id, entry);
      }

      const commentCountByTask = new Map<string, number>();
      for (const row of messageRows ?? []) {
        if (!row.task_id) continue;
        commentCountByTask.set(row.task_id, (commentCountByTask.get(row.task_id) ?? 0) + 1);
      }

      const kudosCountByTask = new Map<string, number>();
      for (const row of kudosRows ?? []) {
        if (!row.task_id) continue;
        kudosCountByTask.set(row.task_id, (kudosCountByTask.get(row.task_id) ?? 0) + 1);
      }

      const doneByColumn = new Map<string, { done: number; total: number }>();
      tasksByColumn = {};
      for (const task of taskRows ?? []) {
        const entry = doneByColumn.get(task.column_id) ?? { done: 0, total: 0 };
        entry.total += 1;
        if (task.status === 'done') entry.done += 1;
        doneByColumn.set(task.column_id, entry);

        const checklist = checklistByTask.get(task.id) ?? { done: 0, total: 0 };
        const card: TaskCardData = {
          id: task.id,
          projectId: project.id,
          columnId: task.column_id,
          title: task.title,
          status: task.status as TaskStatus,
          assignees: assigneesByTask.get(task.id) ?? [],
          checklistDone: checklist.done,
          checklistTotal: checklist.total,
          commentCount: commentCountByTask.get(task.id) ?? 0,
          kudosCount: kudosCountByTask.get(task.id) ?? 0,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        };
        tasksByColumn[task.column_id] = [...(tasksByColumn[task.column_id] ?? []), card];
      }

      columns = (columnRows ?? []).map((column) => ({
        id: column.id,
        name: column.name,
        position: column.position,
        doneCount: doneByColumn.get(column.id)?.done ?? 0,
        totalCount: doneByColumn.get(column.id)?.total ?? 0,
      }));

      members = (memberRows ?? []).map((row) => {
        const profile = row.profiles as unknown as ProfileRef;
        return { userId: row.user_id, name: profile?.full_name || profile?.email || 'Unknown' };
      });

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
        <div className="ml-auto flex items-center gap-1">
          {canManage && (
            <Link
              href={`/projects/${project.id}/members`}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Members
            </Link>
          )}
          <ProjectMuteToggle projectId={project.id} />
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Board
          projectId={project.id}
          columns={columns}
          tasksByColumn={tasksByColumn}
          members={members}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
