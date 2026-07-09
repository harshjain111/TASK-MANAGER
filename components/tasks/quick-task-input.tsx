'use client';

import { useState, useTransition } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createQuickTaskAction } from '@/app/(app)/projects/[projectId]/board/task-actions';

export function QuickTaskInput({ projectId, columnId }: { projectId: string; columnId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setIsOpen(false);
      return;
    }
    startTransition(async () => {
      await createQuickTaskAction(projectId, { columnId, title: trimmed });
      setTitle('');
      setIsOpen(false);
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 flex-1 justify-start gap-1 text-xs"
        onClick={() => setIsOpen(true)}
      >
        <Zap className="size-3.5" />
        Quick task
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        autoFocus
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isPending}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setIsOpen(false);
        }}
        onBlur={submit}
        className="h-8 text-sm"
      />
    </div>
  );
}
