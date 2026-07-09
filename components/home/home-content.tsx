'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TaskDelegationGrid } from './task-delegation-grid';
import { TeamDayView } from './team-day-view';

export function HomeContent({ isManager }: { isManager: boolean }) {
  const [view, setView] = useState<'my' | 'team'>('my');

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {isManager && (
        <div className="flex gap-1 border-b border-border px-4 pt-3">
          {(['my', 'team'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === v
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v === 'my' ? 'My Day' : 'Team Day'}
            </button>
          ))}
        </div>
      )}

      {view === 'my' || !isManager ? <TaskDelegationGrid /> : <TeamDayView />}
    </div>
  );
}
