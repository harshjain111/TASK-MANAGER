'use client';

import { useTransition } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { revokeInviteAction } from './invite-actions';

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label="Revoke invite"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await revokeInviteAction(inviteId);
        })
      }
    >
      <X className="size-4" />
    </Button>
  );
}
