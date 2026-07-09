'use server';

import { createClient } from '@/lib/supabase/server';

export type NotificationRow = {
  id: string;
  type: string;
  payload: { taskId?: string; taskTitle?: string; projectId?: string; columnId?: string; body?: string };
  readAt: string | null;
  createdAt: string;
};

export async function getMyNotificationsAction(): Promise<NotificationRow[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('notifications')
      .select('id, type, payload, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return (data ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      payload: (row.payload ?? {}) as NotificationRow['payload'],
      readAt: row.read_at,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function markNotificationReadAction(id: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  } catch {
    // Best-effort.
  }
}

export async function markAllNotificationsReadAction(): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);
  } catch {
    // Best-effort.
  }
}
