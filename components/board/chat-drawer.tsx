'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { columnChannelName } from '@/lib/realtime/channels';
import {
  getColumnFeedAction,
  getColumnTasksAction,
  sendMessageAction,
  sendAttachmentMessageAction,
  type FeedItem,
} from '@/app/(app)/projects/[projectId]/board/chat-actions';
import { ChatMessage } from './chat-message';

export function ChatDrawer({
  projectId,
  columnId,
  columnName,
  onOpenChange,
}: {
  projectId: string;
  columnId: string | null;
  columnName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [body, setBody] = useState('');
  const [attachToTaskId, setAttachToTaskId] = useState('');
  const [columnTasks, setColumnTasks] = useState<{ id: string; title: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!columnId) return;
    getColumnFeedAction(projectId, columnId).then(setFeed);
    getColumnTasksAction(columnId).then(setColumnTasks);
    setAttachToTaskId('');
  }, [projectId, columnId]);

  useEffect(() => {
    if (!columnId) return;
    const supabase = createClient();
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed]);

  const send = () => {
    if (!columnId) return;
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody('');
    void sendMessageAction({
      columnId,
      body: trimmed,
      taskId: attachToTaskId || undefined,
    });
  };

  const handleUpload = (file: File) => {
    if (!columnId) return;
    setIsUploading(true);
    (async () => {
      const supabase = createClient();
      const path = `${columnId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('chat-attachments').getPublicUrl(path);
        await sendAttachmentMessageAction(
          columnId,
          publicUrl,
          file.name,
          file.type.startsWith('image/'),
          attachToTaskId || undefined,
        );
      }
      setIsUploading(false);
    })();
  };

  return (
    <Sheet open={!!columnId} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{columnName}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-4">
          {feed.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No messages yet. Say hello 👋
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border/40">
              {feed.map((item) => (
                <ChatMessage key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex flex-col gap-2 border-t border-border p-3">
          {columnTasks.length > 0 && (
            <select
              value={attachToTaskId}
              onChange={(e) => setAttachToTaskId(e.target.value)}
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
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder="Message this column…"
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
