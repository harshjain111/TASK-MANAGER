import type { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = ReturnType<typeof createClient>;

/** Inserts a `task_assigned` notification for each newly-assigned user
 * (skipping the actor themselves — you don't need to be told you assigned
 * yourself a task). Best-effort: failures are swallowed so a notification
 * hiccup never blocks the task mutation that triggered it. */
export async function notifyTaskAssigned(
  supabase: SupabaseServerClient,
  orgId: string,
  taskId: string,
  taskTitle: string,
  projectId: string,
  assigneeUserIds: string[],
  actingUserId: string,
) {
  const recipients = assigneeUserIds.filter((id) => id !== actingUserId);
  if (recipients.length === 0) return;

  try {
    await supabase.from('notifications').insert(
      recipients.map((userId) => ({
        org_id: orgId,
        user_id: userId,
        type: 'task_assigned',
        payload: { taskId, taskTitle, projectId },
      })),
    );
  } catch {
    // Non-fatal — see doc comment above.
  }
}
