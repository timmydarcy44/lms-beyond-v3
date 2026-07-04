"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical } from "lucide-react";
import type { TrainingPageBlock } from "@/lib/training-courses/cms-types";
import { TRAINING_PAGE_BLOCK_LABELS } from "@/lib/training-courses/cms-types";

function SortableBlock({
  block,
  onToggle,
}: {
  block: TrainingPageBlock;
  onToggle: (id: TrainingPageBlock["id"]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 ${
        isDragging ? "border-[#635BFF] shadow-md" : "border-gray-200"
      } ${!block.visible ? "opacity-50" : ""}`}
    >
      <button type="button" className="cursor-grab text-gray-400" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm font-medium text-gray-800">{block.label}</span>
      <button
        type="button"
        onClick={() => onToggle(block.id)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        aria-label={block.visible ? "Masquer" : "Afficher"}
      >
        {block.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}

type Props = {
  blocks: TrainingPageBlock[];
  onChange: (blocks: TrainingPageBlock[]) => void;
};

export function TrainingPageBlocksEditor({ blocks, onChange }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }));
    onChange(reordered);
  };

  const toggle = (id: TrainingPageBlock["id"]) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)));
  };

  const reset = () => {
    onChange(
      (Object.keys(TRAINING_PAGE_BLOCK_LABELS) as TrainingPageBlock["id"][]).map((id, order) => ({
        id,
        label: TRAINING_PAGE_BLOCK_LABELS[id],
        visible: !["benefits", "methodology", "case_studies", "deliverables"].includes(id),
        order,
      })),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Structure de la page publique</h3>
          <p className="text-xs text-gray-500">Réordonnez et masquez les blocs affichés sur le site.</p>
        </div>
        <button type="button" onClick={reset} className="text-xs font-medium text-gray-500 hover:text-gray-800">
          Réinitialiser
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {blocks.map((block) => (
              <SortableBlock key={block.id} block={block} onToggle={toggle} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
