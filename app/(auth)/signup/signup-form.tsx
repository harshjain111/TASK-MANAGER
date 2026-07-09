'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { signUpAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignupForm({ inviteToken }: { inviteToken?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { inviteToken },
  });

  const onSubmit = (input: SignupInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signUpAction(input);
      if (result?.needsEmailConfirmation) {
        setCheckEmail(true);
      } else if (result?.error) {
        setServerError(result.error);
      }
    });
  };

  if (checkEmail) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold text-foreground">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent you a confirmation link. Click it, then come back and log in.
        </p>
        <Link href="/login" className="mt-2 text-sm font-medium text-primary hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {inviteToken ? 'Join your team' : 'Create your organization'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {inviteToken
            ? "You've been invited — set up your account to join."
            : 'Start with a new Flowdesk workspace for your org.'}
        </p>
      </div>

      {!inviteToken && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orgName">Organization name</Label>
          <Input id="orgName" placeholder="e.g. All India Cafe Group" {...register('orgName')} />
          {errors.orgName && <p className="text-xs text-destructive">{errors.orgName.message}</p>}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Your name</Label>
        <Input id="fullName" autoComplete="name" {...register('fullName')} />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? 'Creating account…' : 'Sign up'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
