'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskCard, type TaskCardData } from '@/components/tasks/task-card';
import { nextTaskStatus } from '@/lib/utils/task-status';

export function SortableTaskCard({
  task,
  columnId,
  onStatusChange,
  onOpen,
}: {
  task: TaskCardData;
  columnId: string;
  onStatusChange: (taskId: string, next: ReturnType<typeof nextTaskStatus>) => void;
  onOpen: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { type: 'task', columnId },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const next = nextTaskStatus(task.status);

  return (
    // `attributes` (which carry role="button" + tabIndex) live on the handle,
    // not here — spreading them on the wrapper wrapped three real buttons
    // inside a fourth control. The wrapper keeps only the pointer listeners so
    // mouse-dragging anywhere on the card still works.
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      className={cn(isDragging && 'opacity-50')}
    >
      <TaskCard
        task={task}
        onClick={() => onOpen(task.id)}
        onStatusClick={next ? () => onStatusChange(task.id, next) : undefined}
        dragHandle={
          // touch-none is scoped to the handle: on the whole card it stopped
          // the column from scrolling under a finger.
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${task.title}`}
            className="-ml-0.5 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            <GripVertical className="size-3.5" aria-hidden="true" />
          </button>
        }
      />
    </div>
  );
}
