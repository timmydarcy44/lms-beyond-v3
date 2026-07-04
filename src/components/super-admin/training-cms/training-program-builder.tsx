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
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import {
  createId,
  type TrainingProgramChapter,
  type TrainingProgramSection,
  type TrainingProgramSubchapter,
} from "@/lib/training-courses/cms-types";

function SortableRow({
  id,
  children,
  onDuplicate,
  onDelete,
}: {
  id: string;
  children: React.ReactNode;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 rounded-xl border bg-white p-3 ${
        isDragging ? "border-[#635BFF] shadow-md" : "border-gray-200"
      }`}
    >
      <button type="button" className="mt-2 cursor-grab text-gray-400" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 gap-1">
        {onDuplicate ? (
          <button
            type="button"
            onClick={onDuplicate}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
            aria-label="Dupliquer"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

type Props = {
  sections: TrainingProgramSection[];
  onChange: (sections: TrainingProgramSection[]) => void;
};

export function TrainingProgramBuilder({ sections, onChange }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const updateSection = (sectionId: string, patch: Partial<TrainingProgramSection>) => {
    onChange(sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));
  };

  const addSection = () => {
    onChange([
      ...sections,
      { id: createId(), title: "Nouvelle section", description: "", chapters: [] },
    ]);
  };

  const duplicateSection = (section: TrainingProgramSection) => {
    onChange([
      ...sections,
      {
        ...section,
        id: createId(),
        title: `${section.title} (copie)`,
        chapters: section.chapters.map((ch) => ({
          ...ch,
          id: createId(),
          subchapters: ch.subchapters.map((sub) => ({ ...sub, id: createId() })),
        })),
      },
    ]);
  };

  const removeSection = (sectionId: string) => onChange(sections.filter((s) => s.id !== sectionId));

  const reorderSections = (activeId: string, overId: string) => {
    const oldIndex = sections.findIndex((s) => s.id === activeId);
    const newIndex = sections.findIndex((s) => s.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(sections, oldIndex, newIndex));
  };

  const addChapter = (sectionId: string) => {
    onChange(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, chapters: [...s.chapters, { id: createId(), title: "Nouveau chapitre", subchapters: [] }] }
          : s,
      ),
    );
  };

  const updateChapter = (
    sectionId: string,
    chapterId: string,
    patch: Partial<TrainingProgramChapter>,
  ) => {
    onChange(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              chapters: s.chapters.map((ch) => (ch.id === chapterId ? { ...ch, ...patch } : ch)),
            }
          : s,
      ),
    );
  };

  const duplicateChapter = (sectionId: string, chapter: TrainingProgramChapter) => {
    onChange(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              chapters: [
                ...s.chapters,
                {
                  ...chapter,
                  id: createId(),
                  title: `${chapter.title} (copie)`,
                  subchapters: chapter.subchapters.map((sub) => ({ ...sub, id: createId() })),
                },
              ],
            }
          : s,
      ),
    );
  };

  const removeChapter = (sectionId: string, chapterId: string) => {
    onChange(
      sections.map((s) =>
        s.id === sectionId ? { ...s, chapters: s.chapters.filter((ch) => ch.id !== chapterId) } : s,
      ),
    );
  };

  const reorderChapters = (sectionId: string, activeId: string, overId: string) => {
    onChange(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const oldIndex = s.chapters.findIndex((ch) => ch.id === activeId);
        const newIndex = s.chapters.findIndex((ch) => ch.id === overId);
        if (oldIndex < 0 || newIndex < 0) return s;
        return { ...s, chapters: arrayMove(s.chapters, oldIndex, newIndex) };
      }),
    );
  };

  const addSubchapter = (sectionId: string, chapterId: string) => {
    onChange(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              chapters: s.chapters.map((ch) =>
                ch.id === chapterId
                  ? {
                      ...ch,
                      subchapters: [...ch.subchapters, { id: createId(), title: "Nouveau sous-chapitre" }],
                    }
                  : ch,
              ),
            }
          : s,
      ),
    );
  };

  const updateSubchapter = (
    sectionId: string,
    chapterId: string,
    subId: string,
    title: string,
  ) => {
    onChange(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              chapters: s.chapters.map((ch) =>
                ch.id === chapterId
                  ? {
                      ...ch,
                      subchapters: ch.subchapters.map((sub) =>
                        sub.id === subId ? { ...sub, title } : sub,
                      ),
                    }
                  : ch,
              ),
            }
          : s,
      ),
    );
  };

  const removeSubchapter = (sectionId: string, chapterId: string, subId: string) => {
    onChange(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              chapters: s.chapters.map((ch) =>
                ch.id === chapterId
                  ? { ...ch, subchapters: ch.subchapters.filter((sub) => sub.id !== subId) }
                  : ch,
              ),
            }
          : s,
      ),
    );
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderSections(String(active.id), String(over.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Programme détaillé</h3>
          <p className="text-xs text-gray-500">
            Sections → chapitres → sous-chapitres. Structure affichée sur la page publique uniquement.
          </p>
        </div>
        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#635BFF] px-3 py-2 text-xs font-semibold text-white hover:bg-[#7B74FF]"
        >
          <Plus className="h-3.5 w-3.5" />
          Section
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
          Aucune section. Ajoutez une section ou générez le programme avec l&apos;IA.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {sections.map((section) => (
                <SortableRow
                  key={section.id}
                  id={section.id}
                  onDuplicate={() => duplicateSection(section)}
                  onDelete={() => removeSection(section.id)}
                >
                  <div className="space-y-3">
                    <input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      placeholder="Titre de la section"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#635BFF]/40"
                    />
                    <textarea
                      value={section.description ?? ""}
                      onChange={(e) => updateSection(section.id, { description: e.target.value })}
                      placeholder="Description de la section (optionnel)"
                      className="min-h-[60px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40"
                    />

                    <div className="space-y-2 pl-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Chapitres
                        </span>
                        <button
                          type="button"
                          onClick={() => addChapter(section.id)}
                          className="text-xs font-semibold text-[#635BFF] hover:underline"
                        >
                          + Chapitre
                        </button>
                      </div>

                      <ChapterList
                        sectionId={section.id}
                        chapters={section.chapters}
                        sensors={sensors}
                        onReorder={reorderChapters}
                        onUpdate={updateChapter}
                        onDuplicate={duplicateChapter}
                        onRemove={removeChapter}
                        onAddSub={addSubchapter}
                        onUpdateSub={updateSubchapter}
                        onRemoveSub={removeSubchapter}
                      />
                    </div>
                  </div>
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function ChapterList({
  sectionId,
  chapters,
  sensors,
  onReorder,
  onUpdate,
  onDuplicate,
  onRemove,
  onAddSub,
  onUpdateSub,
  onRemoveSub,
}: {
  sectionId: string;
  chapters: TrainingProgramChapter[];
  sensors: ReturnType<typeof useSensors>;
  onReorder: (sectionId: string, activeId: string, overId: string) => void;
  onUpdate: (sectionId: string, chapterId: string, patch: Partial<TrainingProgramChapter>) => void;
  onDuplicate: (sectionId: string, chapter: TrainingProgramChapter) => void;
  onRemove: (sectionId: string, chapterId: string) => void;
  onAddSub: (sectionId: string, chapterId: string) => void;
  onUpdateSub: (sectionId: string, chapterId: string, subId: string, title: string) => void;
  onRemoveSub: (sectionId: string, chapterId: string, subId: string) => void;
}) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(sectionId, String(active.id), String(over.id));
  };

  if (!chapters.length) {
    return <p className="text-xs text-gray-400">Aucun chapitre dans cette section.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={chapters.map((ch) => ch.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <SortableRow
              key={chapter.id}
              id={chapter.id}
              onDuplicate={() => onDuplicate(sectionId, chapter)}
              onDelete={() => onRemove(sectionId, chapter.id)}
            >
              <div className="space-y-2">
                <input
                  value={chapter.title}
                  onChange={(e) => onUpdate(sectionId, chapter.id, { title: e.target.value })}
                  placeholder="Titre du chapitre"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40"
                />
                <div className="space-y-1.5 pl-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Sous-chapitres
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddSub(sectionId, chapter.id)}
                      className="text-[10px] font-semibold text-[#635BFF] hover:underline"
                    >
                      + Sous-chapitre
                    </button>
                  </div>
                  {chapter.subchapters.map((sub: TrainingProgramSubchapter) => (
                    <div key={sub.id} className="flex gap-2">
                      <input
                        value={sub.title}
                        onChange={(e) => onUpdateSub(sectionId, chapter.id, sub.id, e.target.value)}
                        placeholder="Sous-chapitre"
                        className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs outline-none focus:border-[#635BFF]/40"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveSub(sectionId, chapter.id, sub.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
