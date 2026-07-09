import { z } from 'zod';

export const sendMessageSchema = z.object({
  columnId: z.string().uuid(),
  body: z.string().min(1).max(4000),
  taskId: z.string().uuid().optional(),
  mentionedUserIds: z.array(z.string().uuid()).optional(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
