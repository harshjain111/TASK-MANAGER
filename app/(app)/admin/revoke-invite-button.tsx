'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { revokeInviteAction } from './invite-actions';

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label="Revoke invite"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await revokeInviteAction(inviteId);
          if (!result.error) router.refresh();
        })
      }
    >
      <X className="size-4" />
    </Button>
  );
}
