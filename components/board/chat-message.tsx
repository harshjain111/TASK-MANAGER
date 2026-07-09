import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import type { FeedItem } from '@/app/(app)/projects/[projectId]/board/chat-actions';

function systemLine(item: Extract<FeedItem, { kind: 'system' }>): string {
  const title = (item.metadata.title as string | undefined) ?? 'a task';
  switch (item.action) {
    case 'task_created':
      return `${item.actorName} created "${title}"`;
    case 'assigned':
      return `${item.actorName} assigned "${title}"`;
    case 'status_changed': {
      const to = item.metadata.to as string | undefined;
      return `${item.actorName} marked "${title}" as ${to?.replace('_', ' ') ?? 'updated'}`;
    }
    case 'approved':
      return `${item.actorName} approved "${title}"`;
    case 'reopened':
      return `${item.actorName} reopened "${title}"`;
    default:
      return `${item.actorName} updated "${title}"`;
  }
}

export function ChatMessage({ item }: { item: FeedItem }) {
  if (item.kind === 'system') {
    return (
      <div className="py-1 text-center text-xs text-muted-foreground">
        {systemLine(item)} · {format(new Date(item.createdAt), 'MMM d, h:mm a')}
      </div>
    );
  }

  return (
    <div className="flex gap-2 py-1.5">
      <Avatar name={item.authorName} seed={item.authorId} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-foreground">{item.authorName}</span>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(item.createdAt), 'h:mm a')}
          </span>
        </div>
        {item.taskTitle && (
          <span className="mb-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {item.taskTitle}
          </span>
        )}
        {item.messageType === 'photo' && item.attachmentUrl ? (
          <a href={item.attachmentUrl} target="_blank" rel="noreferrer">
            <img
              src={item.attachmentUrl}
              alt={item.body ?? 'Photo'}
              className="mt-1 max-h-48 rounded-lg border border-border"
            />
          </a>
        ) : item.messageType === 'file' && item.attachmentUrl ? (
          <a
            href={item.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <FileText className="size-3.5" />
            {item.body}
          </a>
        ) : (
          <p className="text-sm text-foreground">{item.body}</p>
        )}
      </div>
    </div>
  );
}
