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
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  addChecklistItemAction,
  toggleChecklistItemAction,
  removeChecklistItemAction,
  reorderChecklistItemsAction,
} from '@/app/(app)/projects/[projectId]/board/task-detail-actions';

export type ChecklistItem = { id: string; label: string; isDone: boolean; position: number };

function SortableRow({
  item,
  onToggle,
  onRemove,
}: {
  item: ChecklistItem;
  onToggle: (id: string, isDone: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('flex items-center gap-2 rounded-md px-1 py-1', isDragging && 'opacity-50')}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" />
      </button>
      <input
        type="checkbox"
        checked={item.isDone}
        onChange={(e) => onToggle(item.id, e.target.checked)}
      />
      <span className={cn('flex-1 text-sm', item.isDone && 'text-muted-foreground line-through')}>
        {item.label}
      </span>
      <button
        onClick={() => onRemove(item.id)}
        aria-label="Remove item"
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ChecklistEditor({
  projectId,
  taskId,
  items,
}: {
  projectId: string;
  taskId: string;
  items: ChecklistItem[];
}) {
  const [localItems, setLocalItems] = useState(items);
  const [newLabel, setNewLabel] = useState('');
  useEffect(() => setLocalItems(items), [items]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const addItem = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setNewLabel('');
    void addChecklistItemAction(projectId, taskId, trimmed);
  };

  const toggle = (id: string, isDone: boolean) => {
    setLocalItems((prev) => prev.map((i) => (i.id === id ? { ...i, isDone } : i)));
    void toggleChecklistItemAction(projectId, id, isDone);
  };

  const remove = (id: string) => {
    setLocalItems((prev) => prev.filter((i) => i.id !== id));
    void removeChecklistItemAction(projectId, id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localItems.findIndex((i) => i.id === active.id);
    const newIndex = localItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(next);
    void reorderChecklistItemsAction(
      projectId,
      next.map((i) => i.id),
    );
  };

  const done = localItems.filter((i) => i.isDone).length;

  return (
    <div className="flex flex-col gap-2">
      {localItems.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {done}/{localItems.length} done
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {localItems.map((item) => (
              <SortableRow key={item.id} item={item} onToggle={toggle} onRemove={remove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <Input
          placeholder="Add checklist item"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
