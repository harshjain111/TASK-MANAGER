import { z } from 'zod';

export const karmaRecurrenceTypeSchema = z.enum(['daily', 'weekly', 'monthly', 'custom']);

export const createKarmaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  recurrenceType: karmaRecurrenceTypeSchema,
  recurrenceInterval: z.number().int().min(1).max(365),
  recurrenceDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dueAt: z.string().min(1, 'Due date is required'),
  // Native <select> emits '' for the "Myself" option — accept it as-is and
  // normalize '' -> undefined at the call site (createKarmaAction).
  delegateToUserId: z.union([z.string().uuid(), z.literal('')]).optional(),
});
export type CreateKarmaInput = z.infer<typeof createKarmaSchema>;
