import { z } from 'zod';

export const PROJECT_COLORS = [
  '#6366F1', // indigo
  '#F97066', // red
  '#F79009', // amber
  '#12B76A', // green
  '#15B8A6', // teal
  '#0EA5E9', // sky
  '#A855F7', // violet
  '#EC4899', // pink
] as const;

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required').max(120),
  coverColor: z.enum(PROJECT_COLORS),
  memberIds: z.array(z.string().uuid()),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
