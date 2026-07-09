'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createColumnAction } from '@/app/(app)/projects/[projectId]/board/actions';

export function AddColumnForm({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setIsOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await createColumnAction(projectId, trimmed);
      if (result.error) {
        setError(result.error);
        return;
      }
      setName('');
      setIsOpen(false);
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-10 w-72 shrink-0 justify-start gap-1.5 border border-dashed border-border text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="size-4" />
        Add column
      </Button>
    );
  }

  return (
    <div className="flex w-72 shrink-0 flex-col gap-2 rounded-xl border border-border bg-muted/30 p-2.5">
      <Input
        autoFocus
        placeholder="Column name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setIsOpen(false);
        }}
        disabled={isPending}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={isPending}>
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
