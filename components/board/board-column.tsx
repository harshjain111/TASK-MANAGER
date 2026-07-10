'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Archive, Pencil, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { renameColumnAction, archiveColumnAction } from '@/app/(app)/projects/[projectId]/board/actions';
import { SortableTaskCard } from './sortable-task-card';
import type { TaskCardData } from '@/components/tasks/task-card';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { QuickTaskInput } from '@/components/tasks/quick-task-input';
import type { PickableMember } from '@/components/tasks/assignee-picker';
import type { nextTaskStatus } from '@/lib/utils/task-status';
import { ColumnMuteToggle } from './column-mute-toggle';

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
  tasks,
  members,
  canManage,
  onStatusChange,
  onOpenTask,
  onOpenChat,
  muted,
}: {
  projectId: string;
  column: BoardColumnData;
  tasks: TaskCardData[];
  members: PickableMember[];
  canManage: boolean;
  onStatusChange: (taskId: string, next: ReturnType<typeof nextTaskStatus>) => void;
  onOpenTask: (taskId: string) => void;
  onOpenChat: (columnId: string, columnName: string) => void;
  muted: boolean;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(column.name);
  const [showDone, setShowDone] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' },
    disabled: !canManage,
  });
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `column:${column.id}`,
    data: { type: 'column', columnId: column.id },
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

  const visibleTasks = showDone ? tasks : tasks.filter((t) => t.status !== 'done');

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
          <button
            type="button"
            title="Open column chat"
            onClick={() => onOpenChat(column.id, column.name)}
            className="flex-1 truncate text-left text-sm font-semibold text-foreground hover:underline"
          >
            {column.name}
          </button>
        )}

        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {column.doneCount}/{column.totalCount}
        </span>

        <button
          type="button"
          aria-label="Open column chat"
          title="Open column chat"
          onClick={() => onOpenChat(column.id, column.name)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MessageSquare className="size-3.5" />
        </button>

        <ColumnMuteToggle columnId={column.id} initiallyMuted={muted} />

        <button
          type="button"
          aria-label={showDone ? 'Hide done tasks' : 'Show done tasks'}
          title={showDone ? 'Hide done tasks' : 'Show done tasks'}
          onClick={() => setShowDone((v) => !v)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {showDone ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </button>

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
                    const result = await archiveColumnAction(projectId, column.id);
                    if (!result.error) router.refresh();
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

      <div ref={setDroppableRef} className="flex-1 overflow-auto p-2">
        <SortableContext
          items={visibleTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {visibleTasks.length === 0 ? (
              <p className="p-2 text-center text-xs text-muted-foreground">
                {tasks.length === 0 ? 'No tasks yet.' : 'No tasks to show.'}
              </p>
            ) : (
              visibleTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  columnId={column.id}
                  onStatusChange={onStatusChange}
                  onOpen={onOpenTask}
                />
              ))
            )}

            <div className="flex items-center gap-1 border-t border-border/60 pt-2">
              <CreateTaskDialog projectId={projectId} columnId={column.id} members={members} />
              <QuickTaskInput projectId={projectId} columnId={column.id} />
            </div>
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
