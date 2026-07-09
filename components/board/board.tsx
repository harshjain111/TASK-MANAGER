'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { BoardColumn, type BoardColumnData } from './board-column';
import { AddColumnForm } from './add-column-form';
import { reorderColumnsAction } from '@/app/(app)/projects/[projectId]/board/actions';
import { TaskCard, type TaskCardData } from '@/components/tasks/task-card';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { QuickTaskInput } from '@/components/tasks/quick-task-input';
import type { PickableMember } from '@/components/tasks/assignee-picker';

export function Board({
  projectId,
  columns,
  tasksByColumn,
  members,
  canManage,
}: {
  projectId: string;
  columns: BoardColumnData[];
  tasksByColumn: Record<string, TaskCardData[]>;
  members: PickableMember[];
  canManage: boolean;
}) {
  // Local, optimistic copy of column order — synced whenever the server
  // (via revalidatePath in the column actions) hands us fresh props.
  const [orderedColumns, setOrderedColumns] = useState(columns);
  useEffect(() => setOrderedColumns(columns), [columns]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedColumns.findIndex((c) => c.id === active.id);
    const newIndex = orderedColumns.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(orderedColumns, oldIndex, newIndex);
    setOrderedColumns(next);
    void reorderColumnsAction(
      projectId,
      next.map((c) => c.id),
    );
  };

  if (orderedColumns.length === 0 && !canManage) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No board columns yet — ask a manager to add one.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-3 overflow-x-auto p-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={orderedColumns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          {orderedColumns.map((column) => {
            const tasks = tasksByColumn[column.id] ?? [];
            return (
              <BoardColumn key={column.id} projectId={projectId} column={column} canManage={canManage}>
                <div className="flex flex-col gap-2">
                  {tasks.length === 0 ? (
                    <p className="p-2 text-center text-xs text-muted-foreground">No tasks yet.</p>
                  ) : (
                    tasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}

                  <div className="flex items-center gap-1 border-t border-border/60 pt-2">
                    <CreateTaskDialog projectId={projectId} columnId={column.id} members={members} />
                    <QuickTaskInput projectId={projectId} columnId={column.id} />
                  </div>
                </div>
              </BoardColumn>
            );
          })}
        </SortableContext>
      </DndContext>

      {canManage && <AddColumnForm projectId={projectId} />}
    </div>
  );
}
