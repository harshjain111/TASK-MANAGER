import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ProjectHealth } from '@/app/(app)/reports/project-health-actions';

const TONE_DOT: Record<ProjectHealth['tone'], string> = {
  gray: 'bg-status-not-started',
  blue: 'bg-status-in-progress',
  amber: 'bg-status-stuck',
  green: 'bg-status-done',
};

export function ProjectHealthCard({ health }: { health: ProjectHealth }) {
  const total = Object.values(health.counts).reduce((a, b) => a + b, 0);

  return (
    <Link
      href={`/projects/${health.projectId}/board`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <span className={cn('size-2.5 shrink-0 rounded-full', TONE_DOT[health.tone])} />
        <span className="truncate text-sm font-semibold text-foreground">{health.projectName}</span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{total} tasks</span>
        <span>·</span>
        <span className={cn(health.overdueCount > 0 && 'font-medium text-status-stuck')}>
          {health.overdueCount} overdue
        </span>
        <span>·</span>
        <span>
          {health.onTimeRate === null ? 'No completions (30d)' : `${health.onTimeRate}% on-time (30d)`}
        </span>
      </div>

      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
        {total > 0 && (
          <>
            <div
              className="bg-status-done"
              style={{ width: `${(health.counts.done / total) * 100}%` }}
            />
            <div
              className="bg-status-in-progress"
              style={{ width: `${(health.counts.in_progress / total) * 100}%` }}
            />
            <div
              className="bg-status-review"
              style={{ width: `${(health.counts.review / total) * 100}%` }}
            />
            <div
              className="bg-status-stuck"
              style={{ width: `${(health.counts.stuck / total) * 100}%` }}
            />
            <div
              className="bg-status-not-started"
              style={{ width: `${(health.counts.not_started / total) * 100}%` }}
            />
          </>
        )}
      </div>
    </Link>
  );
}
