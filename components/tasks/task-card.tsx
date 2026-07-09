import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ListChecks } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { StatusPill } from '@/components/shared/status-pill';
import type { TaskStatus } from '@/types/domain';

export type TaskCardData = {
  id: string;
  title: string;
  status: TaskStatus;
  assignees: { userId: string; name: string }[];
  checklistDone: number;
  checklistTotal: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export function TaskCard({ task, onClick }: { task: TaskCardData; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>

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
        <StatusPill status={task.status} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {task.checklistTotal > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks className="size-3.5" />
              {task.checklistDone}/{task.checklistTotal}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {task.commentCount}
          </span>
        </div>
        <span title={new Date(task.updatedAt).toLocaleString()}>
          {task.updatedAt === task.createdAt ? 'Added ' : 'Updated '}
          {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </button>
  );
}
