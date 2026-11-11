import { z } from 'zod';

// Owners aren't created this way — there's exactly one per org, set at signup.
export const createUserRoleSchema = z.enum(['admin', 'manager', 'employee']);

export const createUserSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: createUserRoleSchema,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;
