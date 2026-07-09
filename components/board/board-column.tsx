'use client';

import { useState, useTransition } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Archive, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { renameColumnAction, archiveColumnAction } from '@/app/(app)/projects/[projectId]/board/actions';

export type BoardColumnData = {
  id: string;
  name: string;
  position: number;
  doneCount: number;
  totalCount: number;
};

export function BoardColumn({
  projectId,
  column,
  canManage,
  children,
}: {
  projectId: string;
  column: BoardColumnData;
  canManage: boolean;
  children: React.ReactNode;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(column.name);
  const [isPending, startTransition] = useTransition();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: !canManage,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const commitRename = () => {
    setIsRenaming(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === column.name) {
      setName(column.name);
      return;
    }
    startTransition(async () => {
      const result = await renameColumnAction(projectId, column.id, trimmed);
      if (result.error) setName(column.name);
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border p-2.5">
        {canManage && (
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder column"
            className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        )}

        {isRenaming ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setName(column.name);
                setIsRenaming(false);
              }
            }}
            className="h-7 flex-1 text-sm"
          />
        ) : (
          <span className="flex-1 truncate text-sm font-semibold text-foreground">{column.name}</span>
        )}

        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {column.doneCount}/{column.totalCount}
        </span>

        {canManage && !isRenaming && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Column options"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                disabled={isPending}
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsRenaming(true)}>
                <Pencil className="size-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                destructive
                onSelect={() =>
                  startTransition(async () => {
                    await archiveColumnAction(projectId, column.id);
                  })
                }
              >
                <Archive className="size-3.5" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex-1 overflow-auto p-2">{children}</div>
    </div>
  );
}
