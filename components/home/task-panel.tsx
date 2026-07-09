'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Avatar } from '@/components/shared/avatar';
import { FilterTabs } from '@/components/shared/filter-tabs';
import { getHomeTaskPanelAction, type PanelTask } from '@/app/(app)/home/actions';
import { MY_TASK_TABS, DELEGATED_TASK_TABS, type MyTaskTab, type DelegatedTaskTab } from '@/lib/home-tabs';
import { updateTaskStatusAction } from '@/app/(app)/projects/[projectId]/board/task-actions';

export function TaskPanel({ title, scope }: { title: string; scope: 'my' | 'delegated' }) {
  const router = useRouter();
  const tabs = scope === 'my' ? MY_TASK_TABS : DELEGATED_TASK_TABS;
  const [tab, setTab] = useState<MyTaskTab | DelegatedTaskTab>(tabs[0]);
  const [tasks, setTasks] = useState<PanelTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getHomeTaskPanelAction(scope, tab).then((data) => {
      setTasks(data);
      setIsLoading(false);
    });
  }, [scope, tab]);

  const complete = (task: PanelTask) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    void updateTaskStatusAction(task.projectId, task.id, task.status, 'done');
  };

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-3 pb-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="px-3">
        <FilterTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="p-3 text-center text-xs text-muted-foreground">Nothing here.</p>
        ) : (
          <ul className="flex flex-col">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <input
                  type="checkbox"
                  aria-label="Mark done"
                  onChange={() => complete(task)}
                  className="shrink-0"
                />
                <button
                  onClick={() => router.push(`/projects/${task.projectId}/board`)}
                  className="min-w-0 flex-1 truncate text-left"
                >
                  {task.title}
                </button>
                <Avatar name={task.assigneeName} seed={task.assigneeId} size="sm" />
                {scope === 'delegated' && task.dueAt && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {format(new Date(task.dueAt), 'MMM d')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
