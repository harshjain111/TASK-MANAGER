'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inviteSchema, type InviteInput } from '@/lib/validations/invite';
import { createInviteAction } from './invite-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function InviteForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'employee' },
  });

  const onSubmit = (input: InviteInput) => {
    setServerError(null);
    setInviteLink(null);
    startTransition(async () => {
      const result = await createInviteAction(input);
      if (result.error) {
        setServerError(result.error);
      } else {
        setInviteLink(result.inviteLink ?? null);
        reset({ email: '', role: 'employee' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" type="email" placeholder="teammate@company.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('role')}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Sending…' : 'Send invite'}
        </Button>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      {inviteLink && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p className="mb-1 text-muted-foreground">Invite link (also emailed if Resend is configured):</p>
          <code className="break-all text-foreground">{inviteLink}</code>
        </div>
      )}
    </form>
  );
}
