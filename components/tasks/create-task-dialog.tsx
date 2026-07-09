'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { createTaskSchema, type CreateTaskInput } from '@/lib/validations/task';
import { createTaskAction } from '@/app/(app)/projects/[projectId]/board/task-actions';
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
import { AssigneePicker, type PickableMember } from './assignee-picker';

export function CreateTaskDialog({
  projectId,
  columnId,
  members,
}: {
  projectId: string;
  columnId: string;
  members: PickableMember[];
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [newChecklistLabel, setNewChecklistLabel] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      columnId,
      title: '',
      description: '',
      assigneeIds: [],
      dueAt: '',
      priority: 'medium',
      checklist: [],
    },
  });

  const { fields: checklistFields, append, remove } = useFieldArray({
    control,
    name: 'checklist' as never,
  });
  const assigneeIds = watch('assigneeIds');

  const addChecklistItem = () => {
    const trimmed = newChecklistLabel.trim();
    if (!trimmed) return;
    append(trimmed as never);
    setNewChecklistLabel('');
  };

  const onSubmit = (input: CreateTaskInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createTaskAction(projectId, input);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      setOpen(false);
      reset({
        columnId,
        title: '',
        description: '',
        assigneeIds: [],
        dueAt: '',
        priority: 'medium',
        checklist: [],
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 flex-1 justify-start gap-1 text-xs">
          <Plus className="size-3.5" />
          Add task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[70vh] flex-col gap-4 overflow-auto" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description">Description</Label>
            <textarea
              id="task-description"
              rows={3}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input id="task-due" type="date" {...register('dueAt')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('priority')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Assignees</Label>
            <Controller
              control={control}
              name="assigneeIds"
              render={() => (
                <AssigneePicker
                  members={members}
                  value={assigneeIds}
                  onChange={(next) => setValue('assigneeIds', next)}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Checklist</Label>
            {checklistFields.length > 0 && (
              <ul className="flex flex-col gap-1">
                {checklistFields.map((field, index) => (
                  <li key={field.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{watch(`checklist.${index}`)}</span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label="Remove checklist item"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Checklist item"
                value={newChecklistLabel}
                onChange={(e) => setNewChecklistLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                Add
              </Button>
            </div>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create task'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
