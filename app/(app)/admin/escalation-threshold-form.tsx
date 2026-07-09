'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setEscalationThresholdAction } from './org-settings-actions';

export function EscalationThresholdForm({
  orgId,
  initialHours,
}: {
  orgId: string;
  initialHours: number;
}) {
  const [hours, setHours] = useState(initialHours);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setEscalationThresholdAction(orgId, hours);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground">
        Notify project managers when a task is overdue past this many hours, or stuck for more
        than 24h.
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-sm text-muted-foreground">hours overdue</span>
        <Button size="sm" disabled={isPending} onClick={save}>
          Save
        </Button>
        {saved && <span className="text-xs text-status-done">Saved</span>}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
