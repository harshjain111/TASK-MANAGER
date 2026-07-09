'use client';

import { useState, useTransition } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { giveKudosAction } from '@/app/(app)/projects/[projectId]/board/kudos-actions';
import type { KudosKind } from '@/types/domain';

const KUDOS_OPTIONS: { kind: KudosKind; emoji: string; label: string }[] = [
  { kind: 'clap', emoji: '👏', label: 'Clap' },
  { kind: 'star', emoji: '⭐', label: 'Star' },
  { kind: 'team', emoji: '🙌', label: 'Team win' },
];

export function KudosButton({
  projectId,
  taskId,
  columnId,
  toUserId,
  count,
}: {
  projectId: string;
  taskId: string;
  columnId: string;
  toUserId: string;
  count: number;
}) {
  const [localCount, setLocalCount] = useState(count);
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          disabled={isPending}
          className="flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted"
          aria-label="Give kudos"
        >
          👏 {localCount > 0 && localCount}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {KUDOS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.kind}
            onSelect={() => {
              setLocalCount((c) => c + 1);
              startTransition(async () => {
                const result = await giveKudosAction(projectId, taskId, columnId, toUserId, option.kind);
                if (result.error) setLocalCount((c) => Math.max(0, c - 1));
              });
            }}
          >
            <span>{option.emoji}</span>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
