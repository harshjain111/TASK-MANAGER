'use client';

import { useState, useTransition } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  approveTaskAction,
  reopenTaskAction,
} from '@/app/(app)/projects/[projectId]/board/task-actions';

export function ApprovalPanel({
  projectId,
  taskId,
  columnId,
  onResolved,
}: {
  projectId: string;
  taskId: string;
  columnId: string;
  onResolved: (newStatus: 'done' | 'in_progress') => void;
}) {
  const [isReopening, setIsReopening] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const approve = () => {
    startTransition(async () => {
      const result = await approveTaskAction(projectId, taskId);
      if (!result.error) onResolved('done');
    });
  };

  const reopen = () => {
    setError(null);
    startTransition(async () => {
      const result = await reopenTaskAction(projectId, taskId, columnId, comment);
      if (result.error) {
        setError(result.error);
        return;
      }
      onResolved('in_progress');
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-status-review/40 bg-status-review/5 p-3">
      <p className="text-sm font-medium text-foreground">
        Marked done — awaiting your approval
      </p>

      {isReopening ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            rows={2}
            placeholder="Why are you reopening this? (required)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={isPending} onClick={reopen}>
              Send & reopen
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsReopening(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" disabled={isPending} onClick={approve} className="gap-1.5">
            <Check className="size-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setIsReopening(true)}
            className="gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reopen
          </Button>
        </div>
      )}
    </div>
  );
}
