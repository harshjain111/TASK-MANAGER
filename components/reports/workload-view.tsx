'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { getWorkloadAction, type WorkloadRow } from '@/app/(app)/reports/workload-actions';

export function WorkloadView({
  projects,
  isAdmin,
}: {
  projects: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const [scope, setScope] = useState<string>(projects[0]?.id ?? '');
  const [rows, setRows] = useState<WorkloadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!scope) return;
    setIsLoading(true);
    const action =
      scope === 'org' ? getWorkloadAction({ type: 'org' }) : getWorkloadAction({ type: 'project', projectId: scope });
    action.then((data) => {
      setRows(data);
      setIsLoading(false);
    });
  }, [scope]);

  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">No projects yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Team workload this week</h2>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          {isAdmin && <option value="org">Org-wide</option>}
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open tasks due this week.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.userId} className="flex items-center gap-3">
              <Avatar name={row.name} seed={row.userId} size="sm" />
              <span className="w-28 shrink-0 truncate text-sm text-foreground">{row.name}</span>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={row.flagged ? 'h-full bg-status-stuck' : 'h-full bg-status-in-progress'}
                  style={{ width: `${(row.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm text-foreground">{row.count}</span>
              {row.flagged && <AlertTriangle className="size-4 shrink-0 text-status-stuck" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
