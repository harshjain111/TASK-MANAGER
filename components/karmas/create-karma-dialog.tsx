'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { createKarmaSchema, type CreateKarmaInput } from '@/lib/validations/karma';
import { createKarmaAction } from '@/app/(app)/karmas/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CreateKarmaDialog({
  orgMembers,
}: {
  orgMembers: { userId: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateKarmaInput>({
    resolver: zodResolver(createKarmaSchema),
    defaultValues: {
      title: '',
      description: '',
      recurrenceType: 'daily',
      recurrenceInterval: 1,
      recurrenceDaysOfWeek: [],
      dueAt: '',
      delegateToUserId: undefined,
    },
  });

  const recurrenceType = watch('recurrenceType');
  const daysOfWeek = watch('recurrenceDaysOfWeek') ?? [];

  const toggleDay = (day: number) => {
    setValue(
      'recurrenceDaysOfWeek',
      daysOfWeek.includes(day) ? daysOfWeek.filter((d) => d !== day) : [...daysOfWeek, day],
    );
  };

  const onSubmit = (input: CreateKarmaInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createKarmaAction(input);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      setOpen(false);
      reset();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          New Karma
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New karma</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="karma-title">Title</Label>
            <Input id="karma-title" placeholder="e.g. Daily cash reconciliation" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="karma-description">Description</Label>
            <textarea
              id="karma-description"
              rows={2}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="karma-due">First due date</Label>
              <Input id="karma-due" type="date" {...register('dueAt')} />
              {errors.dueAt && <p className="text-xs text-destructive">{errors.dueAt.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="karma-recurrence">Repeats</Label>
              <select
                id="karma-recurrence"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('recurrenceType')}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {recurrenceType === 'weekly' && (
            <div className="flex flex-col gap-1.5">
              <Label>On these days</Label>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      daysOfWeek.includes(day)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {label[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(recurrenceType === 'daily' || recurrenceType === 'custom') && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="karma-interval">Every N days</Label>
              <Input
                id="karma-interval"
                type="number"
                min={1}
                max={365}
                {...register('recurrenceInterval', { valueAsNumber: true })}
              />
            </div>
          )}

          {orgMembers.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="karma-delegate">Assign to</Label>
              <select
                id="karma-delegate"
                defaultValue=""
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('delegateToUserId')}
              >
                <option value="">Myself</option>
                {orgMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create karma'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
