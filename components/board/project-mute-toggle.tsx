'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMuteStateAction, toggleProjectMuteAction } from '@/app/(app)/projects/[projectId]/board/mute-actions';

export function ProjectMuteToggle({ projectId }: { projectId: string }) {
  const [muted, setMuted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getMuteStateAction(projectId).then((state) => setMuted(state.projectMuted));
  }, [projectId]);

  return (
    <Button
      size="icon"
      variant="ghost"
      disabled={isPending}
      aria-label={muted ? 'Unmute project' : 'Mute project'}
      title={muted ? 'Unmute project' : 'Mute project'}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleProjectMuteAction(projectId);
          setMuted(result.muted);
        })
      }
    >
      {muted ? <BellOff className="size-4" /> : <Bell className="size-4" />}
    </Button>
  );
}
