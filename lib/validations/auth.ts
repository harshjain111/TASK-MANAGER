import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    // Not required when joining via an invite token — you're joining an
    // existing org, not naming a new one. Enforced below with superRefine.
    orgName: z.string().max(120).optional(),
    fullName: z.string().min(1, 'Your name is required').max(120),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    inviteToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.inviteToken && (!data.orgName || data.orgName.trim().length < 2)) {
      ctx.addIssue({
        code: 'custom',
        path: ['orgName'],
        message: 'Organization name is required',
      });
    }
  });
export type SignupInput = z.infer<typeof signupSchema>;
