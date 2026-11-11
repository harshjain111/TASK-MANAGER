'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, type CreateUserInput } from '@/lib/validations/create-user';
import { createUserAction } from './create-user-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function randomTempPassword() {
  // Convenience prefill only, not a security boundary — the admin can see
  // and edit it before sharing it with the new teammate.
  return Math.random().toString(36).slice(-6) + Math.ceil(Math.random() * 9) + 'A!';
}

export function CreateUserForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'employee', password: randomTempPassword() },
  });

  const onSubmit = (input: CreateUserInput) => {
    setServerError(null);
    setCreated(null);
    startTransition(async () => {
      const result = await createUserAction(input);
      if (result.error) {
        setServerError(result.error);
      } else {
        setCreated({ email: input.email, password: input.password });
        reset({ fullName: '', email: '', role: 'employee', password: randomTempPassword() });
        router.refresh();
      }
    });
  };

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-user-name">Name</Label>
          <Input id="new-user-name" placeholder="Priya Sharma" {...register('fullName')} />
          {errors.fullName && <p role="alert" className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-user-email">Email</Label>
          <Input id="new-user-email" type="email" placeholder="teammate@company.com" {...register('email')} />
          {errors.email && <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-user-password">Temp password</Label>
          <div className="flex gap-1.5">
            <Input id="new-user-password" {...register('password')} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setValue('password', randomTempPassword())}
            >
              Regenerate
            </Button>
          </div>
          {errors.password && <p role="alert" className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-user-role">Role</Label>
          <select
            id="new-user-role"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('role')}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create account'}
        </Button>
      </div>

      {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}

      {created && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p className="mb-1 text-muted-foreground">
            Account created — share these credentials with the new teammate:
          </p>
          <p className="text-foreground">
            <span className="text-muted-foreground">Email:</span> {created.email}
          </p>
          <p className="text-foreground">
            <span className="text-muted-foreground">Password:</span>{' '}
            <code className="break-all">{created.password}</code>
          </p>
        </div>
      )}
    </form>
  );
}
