import { Skeleton } from '@/components/ui/skeleton';

// CLAUDE.md §10: "Every list screen needs an empty state and a loading
// skeleton — this app lives or dies on 'does it feel fast'."
//
// Each skeleton mirrors the shape of the screen it stands in for, so the
// layout does not jump when real content replaces it. The wrapper carries
// role="status" so assistive tech hears "Loading" instead of silence.

function Loading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="h-full">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Rows of cards — Tasks, Recurring tasks, Home panels. */
export function ListSkeleton({ rows = 5, label = 'Loading…' }: { rows?: number; label?: string }) {
  return (
    <Loading label={label}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <Skeleton className="h-4 w-2/3" />
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="size-6 rounded-full" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** The Kanban board: horizontal columns of cards. */
export function BoardSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <Loading label="Loading board…">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex h-full gap-3 overflow-hidden p-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30"
            >
              <div className="flex items-center gap-1.5 border-b border-border p-2.5">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <div className="flex flex-col gap-2 p-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="size-6 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** Panel grids — Rewards, Reports, Admin. */
export function PanelGridSkeleton({ panels = 3, label = 'Loading…' }: { panels?: number; label?: string }) {
  return (
    <Loading label={label}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: panels }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <Skeleton className="h-5 w-2/3" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** The org directory: avatar + two lines per person. */
export function DirectorySkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Loading label="Loading team…">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}
