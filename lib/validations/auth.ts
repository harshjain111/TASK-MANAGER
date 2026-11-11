import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Public signup only creates a brand-new organization (and its owner) — an
// admin creates every other teammate account directly from Admin settings.
export const signupSchema = z.object({
  orgName: z.string().min(2, 'Organization name is required').max(120),
  fullName: z.string().min(1, 'Your name is required').max(120),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type SignupInput = z.infer<typeof signupSchema>;
