import { z } from 'zod';

export const columnNameSchema = z.object({
  name: z.string().min(1, 'Column name is required').max(60),
});
export type ColumnNameInput = z.infer<typeof columnNameSchema>;
