'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@/components/shared/avatar';
import {
  getOnTimeLeaderboardAction,
  getKudosLeaderboardAction,
  type LeaderboardRow,
} from '@/app/(app)/rewards/actions';

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardPanel({
  title,
  metric,
  projects,
}: {
  title: string;
  metric: 'on_time' | 'kudos';
  projects: { id: string; name: string }[];
}) {
  const [scope, setScope] = useState('org');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const scopeArg = scope === 'org' ? ({ type: 'org' } as const) : ({ type: 'project', projectId: scope } as const);
    const action = metric === 'on_time' ? getOnTimeLeaderboardAction(scopeArg) : getKudosLeaderboardAction(scopeArg);
    action.then((data) => {
      setRows(data);
      setIsLoading(false);
    });
  }, [scope, metric]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="org">Org-wide</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet this month.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((row, i) => (
            <li key={row.userId} className="flex items-center gap-2 text-sm">
              <span className="w-5 shrink-0 text-center">{MEDALS[i] ?? i + 1}</span>
              <Avatar name={row.name} seed={row.userId} size="sm" />
              <span className="min-w-0 flex-1 truncate text-foreground">{row.name}</span>
              <span className="shrink-0 font-semibold text-foreground">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
