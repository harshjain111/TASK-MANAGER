import { z } from 'zod';

// Owners aren't invited — there's exactly one per org, set at signup.
export const inviteRoleSchema = z.enum(['admin', 'manager', 'employee']);

export const inviteSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  role: inviteRoleSchema,
});
export type InviteInput = z.infer<typeof inviteSchema>;
