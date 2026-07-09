import { z } from 'zod';

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const quickTaskSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
});
export type QuickTaskInput = z.infer<typeof quickTaskSchema>;

export const createTaskSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  assigneeIds: z.array(z.string().uuid()),
  dueAt: z.string().optional(),
  priority: taskPrioritySchema,
  checklist: z.array(z.string().min(1).max(200)),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
