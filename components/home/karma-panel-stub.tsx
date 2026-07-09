'use client';

import { useState } from 'react';
import { FilterTabs } from '@/components/shared/filter-tabs';
import { MY_TASK_TABS, DELEGATED_TASK_TABS, type MyTaskTab, type DelegatedTaskTab } from '@/lib/home-tabs';

export function KarmaPanelStub({ title, scope }: { title: string; scope: 'my' | 'delegated' }) {
  const tabs = scope === 'my' ? MY_TASK_TABS : DELEGATED_TASK_TABS;
  const [tab, setTab] = useState<MyTaskTab | DelegatedTaskTab>(tabs[0]);

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
      <div className="p-3 pb-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="px-3">
        <FilterTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <div className="flex flex-1 items-center justify-center p-3">
        <p className="text-center text-xs text-muted-foreground">
          Karmas (recurring duties) land here in Phase 2 (P20–P21).
        </p>
      </div>
    </div>
  );
}
