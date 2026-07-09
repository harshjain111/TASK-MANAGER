'use server';

import { createClient } from '@/lib/supabase/server';
import { sendMessageSchema, type SendMessageInput } from '@/lib/validations/chat';
import type { MessageType } from '@/types/domain';

type ActionResult = { error: string | null };
type ProfileRef = { full_name: string; email: string } | null;

export type FeedItem =
  | {
      kind: 'message';
      id: string;
      authorId: string;
      authorName: string;
      body: string | null;
      attachmentUrl: string | null;
      messageType: MessageType;
      taskId: string | null;
      taskTitle: string | null;
      createdAt: string;
    }
  | {
      kind: 'system';
      id: string;
      actorId: string;
      actorName: string;
      action: string;
      metadata: Record<string, unknown>;
      createdAt: string;
    };

export async function getColumnFeedAction(projectId: string, columnId: string): Promise<FeedItem[]> {
  try {
    const supabase = createClient();

    const [{ data: messages }, { data: orgId }] = await Promise.all([
      supabase
        .from('chat_messages')
        .select(
          'id, author_id, body, attachment_url, message_type, created_at, profiles(full_name, email), tasks(id, title)',
        )
        .eq('column_id', columnId)
        .order('created_at', { ascending: true }),
      supabase.rpc('get_project_org_id', { check_project_id: projectId }),
    ]);

    const messageItems: FeedItem[] = (messages ?? []).map((m) => {
      const profile = m.profiles as unknown as ProfileRef;
      const task = m.tasks as unknown as { id: string; title: string } | null;
      return {
        kind: 'message',
        id: m.id,
        authorId: m.author_id,
        authorName: profile?.full_name || profile?.email || 'Unknown',
        body: m.body,
        attachmentUrl: m.attachment_url,
        messageType: m.message_type,
        taskId: task?.id ?? null,
        taskTitle: task?.title ?? null,
        createdAt: m.created_at,
      };
    });

    let systemItems: FeedItem[] = [];
    if (orgId) {
      // Tasks currently sitting in this column — their history "follows"
      // them here, even if an event happened before a later move.
      const { data: columnTasks } = await supabase.from('tasks').select('id, title').eq('column_id', columnId);
      const taskIds = (columnTasks ?? []).map((t) => t.id);
      const titleById = new Map((columnTasks ?? []).map((t) => [t.id, t.title]));

      if (taskIds.length > 0) {
        const { data: activity } = await supabase
          .from('activity_log')
          .select('id, actor_id, entity_id, action, metadata, created_at, profiles(full_name, email)')
          .eq('org_id', orgId)
          .eq('entity_type', 'task')
          .in('entity_id', taskIds)
          .order('created_at', { ascending: true });

        systemItems = (activity ?? []).map((a) => {
          const profile = a.profiles as unknown as ProfileRef;
          return {
            kind: 'system',
            id: a.id,
            actorId: a.actor_id,
            actorName: profile?.full_name || profile?.email || 'Someone',
            action: a.action,
            metadata: {
              ...((a.metadata ?? {}) as Record<string, unknown>),
              title: titleById.get(a.entity_id),
            },
            createdAt: a.created_at,
          };
        });
      }
    }

    return [...messageItems, ...systemItems].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

export async function sendMessageAction(
  projectId: string,
  input: SendMessageInput,
): Promise<ActionResult> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be signed in.' };

    const { error } = await supabase.from('chat_messages').insert({
      column_id: parsed.data.columnId,
      task_id: parsed.data.taskId ?? null,
      author_id: user.id,
      body: parsed.data.body,
      message_type: 'text',
    });

    if (error) return { error: error.message };

    // Mentions notify even past a muted column (P18) — mute only suppresses
    // badge/toast delivery, never the underlying notification row.
    const mentioned = (parsed.data.mentionedUserIds ?? []).filter((id) => id !== user.id);
    if (mentioned.length > 0) {
      const { data: orgId } = await supabase.rpc('get_project_org_id', { check_project_id: projectId });
      if (orgId) {
        await supabase.from('notifications').insert(
          mentioned.map((userId) => ({
            org_id: orgId,
            user_id: userId,
            type: 'mention',
            payload: {
              projectId,
              columnId: parsed.data.columnId,
              taskId: parsed.data.taskId ?? null,
              body: parsed.data.body,
            },
          })),
        );
      }
    }

    return { error: null };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function sendAttachmentMessageAction(
  columnId: string,
  fileUrl: string,
  fileName: string,
  isPhoto: boolean,
  taskId?: string,
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be signed in.' };

    const { error } = await supabase.from('chat_messages').insert({
      column_id: columnId,
      task_id: taskId ?? null,
      author_id: user.id,
      body: fileName,
      attachment_url: fileUrl,
      message_type: isPhoto ? 'photo' : 'file',
    });

    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function getColumnTasksAction(
  columnId: string,
): Promise<{ id: string; title: string }[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('column_id', columnId)
      .is('archived_at', null)
      .order('position', { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}
