'use client';

import { cn } from '@/lib/utils';

export function FilterTabs<T extends string>({
  tabs,
  active,
  onChange,
  counts,
}: {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            'relative px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
            active === tab && 'text-foreground',
          )}
        >
          {tab}
          {counts?.[tab] !== undefined && (
            <span className="ml-1 text-[10px] text-muted-foreground">({counts[tab]})</span>
          )}
          {active === tab && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
        </button>
      ))}
    </div>
  );
}
