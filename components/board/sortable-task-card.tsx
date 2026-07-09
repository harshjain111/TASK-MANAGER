'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const next = nextTaskStatus(task.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('touch-none', isDragging && 'opacity-50')}
    >
      <TaskCard
        task={task}
        onClick={() => onOpen(task.id)}
        onStatusClick={next ? () => onStatusChange(task.id, next) : undefined}
      />
    </div>
  );
}
