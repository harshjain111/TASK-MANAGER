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

export function Board({
  projectId,
  columns,
  canManage,
}: {
  projectId: string;
  columns: BoardColumnData[];
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
          {orderedColumns.map((column) => (
            <BoardColumn key={column.id} projectId={projectId} column={column} canManage={canManage}>
              <p className="p-2 text-center text-xs text-muted-foreground">
                Task cards land here in P10.
              </p>
            </BoardColumn>
          ))}
        </SortableContext>
      </DndContext>

      {canManage && <AddColumnForm projectId={projectId} />}
    </div>
  );
}
