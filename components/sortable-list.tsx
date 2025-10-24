'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItem {
  id: string;
  [key: string]: any;
}

interface SortableListProps<T extends SortableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  disabled?: boolean;
}

function SortableItemWrapper<T extends SortableItem>({
  item,
  index,
  renderItem,
  disabled = false,
}: {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        disabled={disabled}
        className="cursor-grab hover:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 p-1 hover:bg-white/10 rounded transition-colors"
        aria-label="Réorganiser"
      >
        <GripVertical size={16} className="text-neutral-400" />
      </button>
      <div className="flex-1">
        {renderItem(item, index)}
      </div>
    </div>
  );
}

export default function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  disabled = false,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over?.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-neutral-400">
        Aucun élément à réorganiser
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableItemWrapper
              key={item.id}
              item={item}
              index={index}
              renderItem={renderItem}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
