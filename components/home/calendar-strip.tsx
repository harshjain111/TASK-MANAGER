'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getMyTasksInRangeAction, getQuickGlanceCountsAction, type HomeTask, type QuickGlanceCounts } from '@/app/(app)/home/actions';
import { rangeForView, daysInRange, shiftAnchor, formatRangeLabel, isSameDay, type CalendarView } from '@/lib/utils/dates';
import { QuickGlanceChips } from './quick-glance-chips';
import { QuickActionBar } from './quick-action-bar';

const VIEWS: CalendarView[] = ['day', 'week', 'month'];

function TaskChip({ task }: { task: HomeTask }) {
  return (
    <div
      className="truncate rounded-md bg-status-in-progress/10 px-1.5 py-0.5 text-[11px] font-medium text-status-in-progress"
      title={`${task.title} — ${task.projectName}`}
    >
      {format(new Date(task.dueAt), 'h:mma').toLowerCase()} {task.title}
    </div>
  );
}

export function CalendarStrip() {
  const router = useRouter();
  const [view, setView] = useState<CalendarView>('day');
  const [anchor, setAnchor] = useState(() => new Date());
  const [tasks, setTasks] = useState<HomeTask[]>([]);
  const [counts, setCounts] = useState<QuickGlanceCounts>({ dueToday: 0, overdue: 0, urgent: 0 });

  const { start, end } = rangeForView(view, anchor);

  useEffect(() => {
    getMyTasksInRangeAction(start.toISOString(), end.toISOString()).then(setTasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, anchor]);

  useEffect(() => {
    getQuickGlanceCountsAction().then(setCounts);
  }, []);

  const tasksForDay = (day: Date) => tasks.filter((t) => isSameDay(new Date(t.dueAt), day));

  const jumpToDay = (day: Date) => {
    setAnchor(day);
    setView('day');
  };

  return (
    <div className="flex flex-col gap-3 border-b border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => setAnchor(shiftAnchor(view, anchor, -1))} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-40 text-sm font-semibold text-foreground">
            {formatRangeLabel(view, anchor)}
          </span>
          <Button size="icon" variant="ghost" onClick={() => setAnchor(shiftAnchor(view, anchor, 1))} aria-label="Next">
            <ChevronRight className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAnchor(new Date())}>
            Today
          </Button>
        </div>

        <div className="flex rounded-lg border border-border p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <QuickGlanceChips counts={counts} />
        <QuickActionBar />
      </div>

      {view === 'day' && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
          {tasksForDay(anchor).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing due today.</p>
          ) : (
            tasksForDay(anchor).map((task) => (
              <button
                key={task.id}
                onClick={() => router.push(`/projects/${task.projectId}/board`)}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="truncate">{task.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format(new Date(task.dueAt), 'h:mm a')}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {view === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {daysInRange(start, end).map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => jumpToDay(day)}
              className={cn(
                'flex flex-col gap-1 rounded-lg border border-border p-2 text-left',
                isSameDay(day, new Date()) && 'border-primary',
              )}
            >
              <span className="text-xs font-semibold text-muted-foreground">{format(day, 'EEE d')}</span>
              <div className="flex flex-col gap-1">
                {tasksForDay(day)
                  .slice(0, 3)
                  .map((task) => (
                    <TaskChip key={task.id} task={task} />
                  ))}
                {tasksForDay(day).length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{tasksForDay(day).length - 3} more
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {view === 'month' && (
        <div className="grid grid-cols-7 gap-1.5">
          {daysInRange(start, end).map((day) => {
            const dayTasks = tasksForDay(day);
            const inMonth = day.getMonth() === anchor.getMonth();
            return (
              <button
                key={day.toISOString()}
                onClick={() => jumpToDay(day)}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded-lg border border-transparent text-xs hover:border-border',
                  !inMonth && 'text-muted-foreground/40',
                  isSameDay(day, new Date()) && 'border-primary',
                )}
              >
                <span>{format(day, 'd')}</span>
                {dayTasks.length > 0 && <span className="size-1.5 rounded-full bg-status-in-progress" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
