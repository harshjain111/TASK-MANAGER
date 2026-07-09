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
import { moveTaskAction, updateTaskStatusAction } from '@/app/(app)/projects/[projectId]/board/task-actions';
import type { TaskCardData } from '@/components/tasks/task-card';
import type { PickableMember } from '@/components/tasks/assignee-picker';
import type { TaskStatus } from '@/types/domain';
import { TaskDetailSheet } from '@/components/tasks/task-detail-sheet';
import { ChatDrawer } from './chat-drawer';

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
  // Local, optimistic copies — synced whenever the server (via
  // revalidatePath in the column/task actions) hands us fresh props.
  const [orderedColumns, setOrderedColumns] = useState(columns);
  const [tasksState, setTasksState] = useState(tasksByColumn);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [chatColumn, setChatColumn] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => setOrderedColumns(columns), [columns]);
  useEffect(() => setTasksState(tasksByColumn), [tasksByColumn]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleStatusChange = (taskId: string, next: TaskStatus | null) => {
    if (!next) return;
    let fromStatus: TaskStatus | undefined;
    setTasksState((prev) => {
      const copy: Record<string, TaskCardData[]> = {};
      for (const [columnId, tasks] of Object.entries(prev)) {
        copy[columnId] = tasks.map((t) => {
          if (t.id === taskId) {
            fromStatus = t.status;
            return { ...t, status: next, updatedAt: new Date().toISOString() };
          }
          return t;
        });
      }
      return copy;
    });
    if (fromStatus) void updateTaskStatusAction(projectId, taskId, fromStatus, next);
  };

  const findTaskColumn = (taskId: string) =>
    Object.entries(tasksState).find(([, tasks]) => tasks.some((t) => t.id === taskId))?.[0];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === 'column') {
      if (active.id === over.id) return;
      const oldIndex = orderedColumns.findIndex((c) => c.id === active.id);
      const newIndex = orderedColumns.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const next = arrayMove(orderedColumns, oldIndex, newIndex);
      setOrderedColumns(next);
      void reorderColumnsAction(
        projectId,
        next.map((c) => c.id),
      );
      return;
    }

    if (activeType === 'task') {
      const taskId = active.id as string;
      const sourceColumnId = findTaskColumn(taskId);
      if (!sourceColumnId) return;

      const overType = over.data.current?.type;
      const destColumnId =
        overType === 'task'
          ? (findTaskColumn(over.id as string) ?? sourceColumnId)
          : overType === 'column'
            ? (over.data.current?.columnId as string)
            : sourceColumnId;

      const movedTask = tasksState[sourceColumnId]?.find((t) => t.id === taskId);
      if (!movedTask) return;

      setTasksState((prev) => {
        const next = { ...prev };
        const source = (next[sourceColumnId] ?? []).filter((t) => t.id !== taskId);

        if (sourceColumnId === destColumnId) {
          const overIndex = source.findIndex((t) => t.id === over.id);
          const insertAt = overType === 'task' && overIndex !== -1 ? overIndex : source.length;
          source.splice(insertAt, 0, movedTask);
          next[sourceColumnId] = source;
        } else {
          next[sourceColumnId] = source;
          const dest = [...(next[destColumnId] ?? [])];
          const overIndex = dest.findIndex((t) => t.id === over.id);
          const insertAt = overType === 'task' && overIndex !== -1 ? overIndex : dest.length;
          dest.splice(insertAt, 0, movedTask);
          next[destColumnId] = dest;
        }

        void moveTaskAction(
          projectId,
          taskId,
          destColumnId,
          next[destColumnId]!.map((t) => t.id),
          sourceColumnId !== destColumnId ? sourceColumnId : undefined,
          sourceColumnId !== destColumnId ? next[sourceColumnId]!.map((t) => t.id) : undefined,
        );

        return next;
      });
    }
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
            <BoardColumn
              key={column.id}
              projectId={projectId}
              column={column}
              tasks={tasksState[column.id] ?? []}
              members={members}
              canManage={canManage}
              onStatusChange={handleStatusChange}
              onOpenTask={setSelectedTaskId}
              onOpenChat={(id, name) => setChatColumn({ id, name })}
            />
          ))}
        </SortableContext>
      </DndContext>

      {canManage && <AddColumnForm projectId={projectId} />}

      <TaskDetailSheet
        projectId={projectId}
        taskId={selectedTaskId}
        members={members}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />

      <ChatDrawer
        projectId={projectId}
        columnId={chatColumn?.id ?? null}
        columnName={chatColumn?.name ?? ''}
        onOpenChange={(open) => !open && setChatColumn(null)}
      />
    </div>
  );
}
