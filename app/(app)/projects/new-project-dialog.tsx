'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Check } from 'lucide-react';
import { createProjectSchema, PROJECT_COLORS, type CreateProjectInput } from '@/lib/validations/project';
import { createProjectAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar } from '@/components/shared/avatar';
import { cn } from '@/lib/utils';

export function NewProjectDialog({
  orgMembers,
}: {
  orgMembers: { userId: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', coverColor: PROJECT_COLORS[0], memberIds: [] },
  });

  const selectedColor = watch('coverColor');
  const selectedMemberIds = watch('memberIds');

  const onSubmit = (input: CreateProjectInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createProjectAction(input);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      setOpen(false);
      reset();
      if (result.projectId) router.push(`/projects/${result.projectId}/board`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            A project is an outlet, site, or tender — its board columns are the
            sub-projects underneath it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" placeholder="e.g. All India Cafe — Koramangala" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Color ${color}`}
                  onClick={() => setValue('coverColor', color, { shouldValidate: true })}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow',
                    selectedColor === color && 'ring-2 ring-ring',
                  )}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && <Check className="size-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {orgMembers.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Initial members</Label>
              <div className="flex max-h-40 flex-col gap-1 overflow-auto rounded-lg border border-border p-2">
                <Controller
                  control={control}
                  name="memberIds"
                  render={() => (
                    <>
                      {orgMembers.map((member) => {
                        const checked = selectedMemberIds.includes(member.userId);
                        return (
                          <label
                            key={member.userId}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setValue(
                                  'memberIds',
                                  e.target.checked
                                    ? [...selectedMemberIds, member.userId]
                                    : selectedMemberIds.filter((id) => id !== member.userId),
                                );
                              }}
                            />
                            <Avatar name={member.name} seed={member.userId} size="sm" />
                            {member.name}
                          </label>
                        );
                      })}
                    </>
                  )}
                />
              </div>
            </div>
          )}

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create project'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
