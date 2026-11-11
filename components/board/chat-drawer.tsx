'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Send, Paperclip, AlertCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/avatar';
import { createClient } from '@/lib/supabase/client';
import { columnChannelName } from '@/lib/realtime/channels';
import {
  getColumnFeedAction,
  getColumnTasksAction,
  sendMessageAction,
  sendAttachmentMessageAction,
  type FeedItem,
} from '@/app/(app)/projects/[projectId]/board/chat-actions';
import type { PickableMember } from '@/components/tasks/assignee-picker';
import { ChatMessage } from './chat-message';

/** Supabase Storage accepts far larger, but a board chat does not need to. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Keeps user-supplied filenames from shaping the storage path. */
function safeFileName(name: string): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+/, '');
  return (cleaned || 'file').slice(-80);
}

export function ChatDrawer({
  projectId,
  columnId,
  columnName,
  members,
  currentUser,
  onOpenChange,
}: {
  projectId: string;
  columnId: string | null;
  columnName: string;
  members: PickableMember[];
  currentUser: { userId: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [pending, setPending] = useState<FeedItem[]>([]);
  const [body, setBody] = useState('');
  const [attachToTaskId, setAttachToTaskId] = useState('');
  const [columnTasks, setColumnTasks] = useState<{ id: string; title: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionedIds, setMentionedIds] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenCount = useRef(0);
  const listboxId = useId();

  useEffect(() => {
    if (!columnId) return;
    getColumnFeedAction(projectId, columnId).then(setFeed);
    getColumnTasksAction(columnId).then(setColumnTasks);
    setAttachToTaskId('');
    setMentionedIds(new Set());
    setPending([]);
    setError(null);
    seenCount.current = 0;
  }, [projectId, columnId]);

  useEffect(() => {
    if (!columnId) return;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    const channel = supabase
      .channel(columnChannelName(columnId))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `column_id=eq.${columnId}` },
        () => {
          // Re-fetch rather than trust the raw payload shape — we need the
          // joined author/task names the initial load already resolves.
          getColumnFeedAction(projectId, columnId).then(setFeed);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, columnId]);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    bottomRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }, [feed, pending]);

  // A realtime feed that only repaints is invisible to screen-reader users.
  // Announce arrivals from other people; our own echo is already known.
  useEffect(() => {
    if (feed.length <= seenCount.current) {
      seenCount.current = feed.length;
      return;
    }
    seenCount.current = feed.length;
    const latest = feed[feed.length - 1];
    if (!latest) return;
    if (latest.kind === 'system') {
      setAnnouncement(`${latest.actorName} updated a task`);
      return;
    }
    if (latest.authorId === currentUser?.userId) return;
    setAnnouncement(
      latest.body
        ? `${latest.authorName} says ${latest.body}`
        : `${latest.authorName} sent an attachment`,
    );
  }, [feed, currentUser]);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 5);
  }, [mentionQuery, members]);

  useEffect(() => setMentionIndex(0), [mentionQuery]);

  const handleBodyChange = (value: string, caret: number) => {
    setBody(value);
    const upToCaret = value.slice(0, caret);
    const match = upToCaret.match(/@([\w\s]{0,30})$/);
    setMentionQuery(match ? match[1]! : null);
  };

  const pickMention = useCallback(
    (member: PickableMember) => {
      const caret = inputRef.current?.selectionStart ?? body.length;
      const upToCaret = body.slice(0, caret);
      const replaced = upToCaret.replace(/@([\w\s]{0,30})$/, `@${member.name} `);
      const nextBody = replaced + body.slice(caret);
      setBody(nextBody);
      setMentionQuery(null);
      setMentionedIds((prev) => new Set(prev).add(member.userId));
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [body],
  );

  const send = () => {
    if (!columnId) return;
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody('');
    setError(null);
    // Only notify mentions whose "@Name" text is still actually present —
    // covers the user deleting a mention after picking it from the list.
    const mentioned = Array.from(mentionedIds).filter((id) => {
      const member = members.find((m) => m.userId === id);
      return member && trimmed.includes(`@${member.name}`);
    });
    setMentionedIds(new Set());

    const taskId = attachToTaskId || undefined;
    // Reset the attachment target: leaving it set silently re-attached every
    // following message to the same task.
    setAttachToTaskId('');

    // Optimistic echo (CLAUDE.md §6) — reconciled against the server feed on
    // confirm, rolled back with the draft restored on failure.
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setPending((prev) => [
      ...prev,
      {
        kind: 'message',
        id: tempId,
        authorId: currentUser?.userId ?? '',
        authorName: currentUser?.name ?? 'You',
        body: trimmed,
        attachmentUrl: null,
        messageType: 'text',
        taskId: taskId ?? null,
        taskTitle: columnTasks.find((t) => t.id === taskId)?.title ?? null,
        createdAt: new Date().toISOString(),
      },
    ]);

    void sendMessageAction(projectId, {
      columnId,
      body: trimmed,
      taskId,
      mentionedUserIds: mentioned,
    }).then((result) => {
      if (result.error) {
        setPending((prev) => prev.filter((m) => m.id !== tempId));
        setError(result.error);
        setBody((current) => current || trimmed);
        setAttachToTaskId(taskId ?? '');
        return;
      }
      getColumnFeedAction(projectId, columnId).then((next) => {
        setFeed(next);
        setPending((prev) => prev.filter((m) => m.id !== tempId));
      });
    });
  };

  const handleUpload = (file: File) => {
    if (!columnId) return;
    setError(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`"${file.name}" is larger than 10 MB. Please attach a smaller file.`);
      return;
    }

    const taskId = attachToTaskId || undefined;
    setIsUploading(true);
    (async () => {
      try {
        const supabase = createClient();
        const path = `${columnId}/${Date.now()}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(path, file);

        // Previously an `if (!error)` with no else — a failed upload looked
        // exactly like a successful one.
        if (uploadError) {
          setError('Upload failed. Please check your connection and try again.');
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('chat-attachments').getPublicUrl(path);

        const result = await sendAttachmentMessageAction(
          columnId,
          publicUrl,
          file.name,
          file.type.startsWith('image/'),
          taskId,
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        setAttachToTaskId('');
      } catch {
        setError('Upload failed. Please check your connection and try again.');
      } finally {
        setIsUploading(false);
      }
    })();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const hasMatches = mentionMatches.length > 0;

    if (event.key === 'Escape') {
      if (hasMatches || mentionQuery !== null) {
        // Without this the Escape also reaches the Sheet, closing the whole
        // drawer and discarding the draft.
        event.preventDefault();
        event.stopPropagation();
        setMentionQuery(null);
      }
      return;
    }

    if (hasMatches) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionMatches.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        const member = mentionMatches[mentionIndex];
        if (member) {
          event.preventDefault();
          pickMention(member);
        }
        return;
      }
    }

    if (event.key === 'Enter') send();
  };

  const activeMentionId = mentionMatches[mentionIndex]
    ? `${listboxId}-option-${mentionMatches[mentionIndex]!.userId}`
    : undefined;

  const items = [...feed, ...pending];

  return (
    <Sheet open={!!columnId} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{columnName}</SheetTitle>
          <SheetDescription>
            Discussion for this column. Type @ to mention a teammate.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No messages yet. Say hello 👋
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border/40">
              {items.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  className={item.id.startsWith('pending-') ? 'opacity-60' : undefined}
                >
                  <ChatMessage item={item} />
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <div className="relative flex flex-col gap-2 border-t border-border p-3">
          {mentionMatches.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Mention a teammate"
              className="absolute bottom-full left-3 mb-1 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-md"
            >
              {mentionMatches.map((member, index) => (
                <li key={member.userId} role="presentation">
                  <button
                    id={`${listboxId}-option-${member.userId}`}
                    role="option"
                    aria-selected={index === mentionIndex}
                    type="button"
                    onMouseEnter={() => setMentionIndex(index)}
                    onClick={() => pickMention(member)}
                    className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted ${
                      index === mentionIndex ? 'bg-muted' : ''
                    }`}
                  >
                    <Avatar name={member.name} seed={member.userId} size="sm" />
                    {member.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p
              role="alert"
              className="flex items-start gap-1.5 text-xs text-destructive"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          {columnTasks.length > 0 && (
            <select
              value={attachToTaskId}
              onChange={(e) => setAttachToTaskId(e.target.value)}
              aria-label="Attach this message to a task"
              className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">General discussion</option>
              {columnTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  Re: {task.title}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach photo or file"
            >
              <Paperclip className="size-4" />
            </Button>
            <input
              ref={inputRef}
              value={body}
              onChange={(e) =>
                handleBodyChange(e.target.value, e.target.selectionStart ?? e.target.value.length)
              }
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={mentionMatches.length > 0}
              aria-controls={mentionMatches.length > 0 ? listboxId : undefined}
              aria-activedescendant={activeMentionId}
              aria-autocomplete="list"
              aria-label={`Message ${columnName}`}
              placeholder="Message this column… (@ to mention)"
              className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="button" size="icon" onClick={send} aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
