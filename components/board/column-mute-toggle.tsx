'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toggleColumnMuteAction } from '@/app/(app)/projects/[projectId]/board/mute-actions';

export function ColumnMuteToggle({
  columnId,
  initiallyMuted,
}: {
  columnId: string;
  initiallyMuted: boolean;
}) {
  const [muted, setMuted] = useState(initiallyMuted);
  const [isPending, startTransition] = useTransition();
  useEffect(() => setMuted(initiallyMuted), [initiallyMuted]);

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label={muted ? 'Unmute column' : 'Mute column'}
      title={muted ? 'Unmute column' : 'Mute column'}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleColumnMuteAction(columnId);
          setMuted(result.muted);
        })
      }
      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {muted ? <BellOff className="size-3.5" /> : <Bell className="size-3.5" />}
    </button>
  );
}
