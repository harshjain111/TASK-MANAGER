'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Check, RotateCcw } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { FilterTabs } from '@/components/shared/filter-tabs';
import { Button } from '@/components/ui/button';
import {
  getKarmaPanelAction,
  updateKarmaStatusAction,
  approveKarmaAction,
  reopenKarmaAction,
  type PanelKarma,
} from '@/app/(app)/karmas/actions';
import { MY_TASK_TABS, DELEGATED_TASK_TABS, type MyTaskTab, type DelegatedTaskTab } from '@/lib/home-tabs';

function ReopenRow({ karmaId, onDone }: { karmaId: string; onDone: () => void }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsOpen(true)}>
        <RotateCcw className="size-3.5" />
        Reopen
      </Button>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-1.5">
      <input
        autoFocus
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Why reopen? (required)"
        className="h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button
        size="sm"
        onClick={async () => {
          const result = await reopenKarmaAction(karmaId, comment);
          if (result.error) setError(result.error);
          else onDone();
        }}
      >
        Send
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function KarmaPanel({ title, scope }: { title: string; scope: 'my' | 'delegated' }) {
  const tabs = scope === 'my' ? MY_TASK_TABS : DELEGATED_TASK_TABS;
  const [tab, setTab] = useState<MyTaskTab | DelegatedTaskTab>(tabs[0]);
  const [karmas, setKarmas] = useState<PanelKarma[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = () => {
    setIsLoading(true);
    getKarmaPanelAction(scope, tab).then((data) => {
      setKarmas(data);
      setIsLoading(false);
    });
  };

  useEffect(refresh, [scope, tab]);

  const complete = (karma: PanelKarma) => {
    setKarmas((prev) => prev.filter((k) => k.id !== karma.id));
    void updateKarmaStatusAction(karma.id, karma.status, 'done').then(() => refresh());
  };

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
      <div className="p-3 pb-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="px-3">
        <FilterTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : karmas.length === 0 ? (
          <p className="p-3 text-center text-xs text-muted-foreground">Nothing here.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {karmas.map((karma) => (
              <li key={karma.id} className="flex flex-col gap-1 rounded-md px-2 py-1.5 hover:bg-muted">
                <div className="flex items-center gap-2 text-sm">
                  {karma.status !== 'review' && (
                    <input
                      type="checkbox"
                      aria-label="Mark done"
                      onChange={() => complete(karma)}
                      className="shrink-0"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">{karma.title}</span>
                  <Avatar name={karma.ownerName} seed={karma.ownerId} size="sm" />
                  {scope === 'delegated' && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(new Date(karma.dueAt), 'MMM d')}
                    </span>
                  )}
                </div>
                {tab === 'Review' && scope === 'delegated' && (
                  <div className="flex items-center gap-1.5 pl-6">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={async () => {
                        await approveKarmaAction(karma.id);
                        refresh();
                      }}
                    >
                      <Check className="size-3.5" />
                      Approve
                    </Button>
                    <ReopenRow karmaId={karma.id} onDone={refresh} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
