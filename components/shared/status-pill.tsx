import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types/domain';

const LABELS: Record<TaskStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  stuck: 'Stuck',
  done: 'Done',
  review: 'Review',
};

// Maps 1:1 to the --status-* CSS vars defined in app/globals.css (CLAUDE.md §5).
const DOT_CLASS: Record<TaskStatus, string> = {
  not_started: 'bg-status-not-started',
  in_progress: 'bg-status-in-progress',
  stuck: 'bg-status-stuck',
  done: 'bg-status-done',
  review: 'bg-status-review',
};

const TEXT_CLASS: Record<TaskStatus, string> = {
  not_started: 'text-status-not-started',
  in_progress: 'text-status-in-progress',
  stuck: 'text-status-stuck',
  done: 'text-status-done',
  review: 'text-status-review',
};

export function StatusPill({
  status,
  onClick,
  className,
}: {
  status: TaskStatus;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium',
        TEXT_CLASS[status],
        onClick && 'cursor-pointer hover:bg-muted',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', DOT_CLASS[status])} />
      {LABELS[status]}
    </Comp>
  );
}
