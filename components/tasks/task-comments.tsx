'use client';

import { useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { Button } from '@/components/ui/button';
import { addTaskCommentAction } from '@/app/(app)/projects/[projectId]/board/task-detail-actions';

export type TaskComment = {
  id: string;
  authorId: string;
  authorName: string;
  body: string | null;
  createdAt: string;
};

export function TaskComments({
  projectId,
  taskId,
  columnId,
  comments,
}: {
  projectId: string;
  taskId: string;
  columnId: string;
  comments: TaskComment[];
}) {
  const [localComments, setLocalComments] = useState(comments);
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();

  const send = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody('');
    startTransition(async () => {
      await addTaskCommentAction(projectId, taskId, columnId, trimmed);
      setLocalComments((prev) => [
        ...prev,
        {
          id: `optimistic-${Date.now()}`,
          authorId: 'me',
          authorName: 'You',
          body: trimmed,
          createdAt: new Date().toISOString(),
        },
      ]);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {localComments.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No comments yet. The full column chat drawer lands in Phase 2 (P16).
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {localComments.map((comment) => (
            <li key={comment.id} className="flex gap-2">
              <Avatar name={comment.authorName} seed={comment.authorId} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-foreground">{comment.authorName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <textarea
          rows={2}
          placeholder="Write a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="button" size="icon" disabled={isPending} onClick={send} aria-label="Send comment">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
