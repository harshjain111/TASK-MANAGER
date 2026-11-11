import type { ReactNode } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ListChecks } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { StatusPill } from '@/components/shared/status-pill';
import { KudosButton } from '@/components/shared/kudos-button';
import type { TaskStatus } from '@/types/domain';

export type TaskCardData = {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  status: TaskStatus;
  assignees: { userId: string; name: string }[];
  checklistDone: number;
  checklistTotal: number;
  commentCount: number;
  kudosCount: number;
  createdAt: string;
  updatedAt: string;
};

export function TaskCard({
  task,
  onClick,
  onStatusClick,
  dragHandle,
}: {
  task: TaskCardData;
  onClick?: () => void;
  /** Omit to render a non-interactive pill (e.g. read-only contexts). */
  onStatusClick?: () => void;
  /** Rendered before the title. Supplied by SortableTaskCard on the board. */
  dragHandle?: ReactNode;
}) {
  const primaryAssignee = task.assignees[0];

  // The card lifts on hover, so the whole surface has to be clickable or the
  // affordance lies. Clicks that land on a nested control belong to that
  // control; the title button remains the keyboard/AT path into the task.
  const handleSurfaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if ((event.target as HTMLElement).closest('button, a, input, select')) return;
    onClick();
  };

  return (
    <div
      onClick={handleSurfaceClick}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-1.5">
        {dragHandle}
        <button
          type="button"
          onClick={onClick}
          className="flex-1 rounded-sm text-left text-sm font-medium leading-snug text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          {task.title}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {task.assignees.slice(0, 3).map((assignee) => (
            <Avatar
              key={assignee.userId}
              name={assignee.name}
              seed={assignee.userId}
              size="sm"
              className="ring-2 ring-card"
            />
          ))}
          {task.assignees.length > 3 && (
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
              +{task.assignees.length - 3}
            </span>
          )}
        </div>
        <StatusPill status={task.status} onClick={onStatusClick} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {task.checklistTotal > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Checklist: </span>
              {task.checklistDone}/{task.checklistTotal}
              <span className="sr-only"> done</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" aria-hidden="true" />
            {task.commentCount}
            <span className="sr-only">
              {task.commentCount === 1 ? ' comment' : ' comments'}
            </span>
          </span>
          {task.status === 'done' && primaryAssignee && (
            <KudosButton
              projectId={task.projectId}
              taskId={task.id}
              columnId={task.columnId}
              toUserId={primaryAssignee.userId}
              count={task.kudosCount}
            />
          )}
        </div>
        <span title={new Date(task.updatedAt).toLocaleString()}>
          {task.updatedAt === task.createdAt ? 'Added ' : 'Updated '}
          {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
