import type { QuickGlanceCounts } from '@/app/(app)/home/actions';

export function QuickGlanceChips({ counts }: { counts: QuickGlanceCounts }) {
  const chips = [
    { label: 'Due today', value: counts.dueToday, tone: 'text-status-in-progress' },
    { label: 'Overdue', value: counts.overdue, tone: 'text-status-stuck' },
    { label: 'Urgent', value: counts.urgent, tone: 'text-destructive' },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium"
        >
          <span className={chip.tone}>{chip.value}</span>
          <span className="text-muted-foreground">{chip.label}</span>
        </span>
      ))}
    </div>
  );
}
