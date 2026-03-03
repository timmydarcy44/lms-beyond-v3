"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState, useTransition } from "react";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clapperboard,
  FileText,
  GripVertical,
  Headphones,
  Plus,
  Text,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useCourseBuilder, BuilderSelection } from "@/hooks/use-course-builder";
import {
  BuilderContentType,
  CourseBuilderChapter,
  CourseBuilderSection,
  CourseBuilderSubchapter,
} from "@/types/course-builder";

import { ChapterGenerationModal } from "@/components/formateur/ai/chapter-generation-modal";
import { SubchapterGenerationModal } from "@/components/formateur/ai/subchapter-generation-modal";
import { toast } from "sonner";
import { RichTextEditor } from "./rich-text-editor";
import { MediaUploader } from "./media-uploader";
import { FlashcardsManager } from "./flashcards-manager";
import { X } from "lucide-react";

type ContentTypeOption = {
  value: BuilderContentType;
  label: string;
  icon: typeof Clapperboard;
};

const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  { value: "video", label: "Vidéo", icon: Clapperboard },
  { value: "audio", label: "Audio", icon: Headphones },
  { value: "document", label: "Document", icon: FileText },
  { value: "text", label: "Texte", icon: Text },
];

const CONTENT_TYPE_MAP = Object.fromEntries(
  CONTENT_TYPE_OPTIONS.map((option) => [option.value, option]),
);

export function CourseStructureBuilder({ previewHref, courseId }: { previewHref?: string; courseId?: string }) {
  const sections = useCourseBuilder((state) => state.snapshot.sections);
  const selection = useCourseBuilder((state) => state.selection);
  const addSection = useCourseBuilder((state) => state.addSection);
  const reorderSections = useCourseBuilder((state) => state.reorderSections);
  const moveChapter = useCourseBuilder((state) => state.moveChapter);
  const addChapter = useCourseBuilder((state) => state.addChapter);
  const addSubchapter = useCourseBuilder((state) => state.addSubchapter);
  const moveSubchapter = useCourseBuilder((state) => state.moveSubchapter);
  const clearSelection = useCourseBuilder((state) => state.clearSelection);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedSelection, setExpandedSelection] = useState<BuilderSelection | null>(null);

  const previewLink = previewHref ?? "/dashboard/student/studio/formations/new/preview";

  const dragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as
      | { type: "section"; sectionId: string }
      | { type: "chapter"; sectionId: string; chapterId: string }
      | { type: "subchapter"; sectionId: string; chapterId: string; subchapterId: string }
      | undefined;
    const overData = over.data.current as
      | { type: "section"; sectionId: string }
      | { type: "section-container"; sectionId: string }
      | { type: "chapter"; sectionId: string; chapterId: string; sortable?: { index: number } }
      | { type: "chapter-container"; sectionId: string }
      | {
          type: "subchapter";
          sectionId: string;
          chapterId: string;
          subchapterId: string;
          sortable?: { index: number };
        }
      | { type: "subchapter-container"; sectionId: string; chapterId: string }
      | undefined;

    if (!activeData) return;

    // Gérer le drag and drop ici
    // TODO: Implémenter handleDragActive si nécessaire
  };

  useEffect(() => {
    if (selection) {
      setIsEditorOpen(true);
      setExpandedSelection(selection);
    }
  }, [selection]);

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    clearSelection();
  };

  const modalContext = useMemo(() => {
    const target = selection ?? expandedSelection;
    if (!target) {
      return { title: "Éditeur de contenu", subtitle: "" };
    }

    const section = sections.find((item) => item.id === target.sectionId);
    const chapter =
      section?.chapters.find((item) => item.id === target.chapterId) ?? null;
    const subchapter =
      target.type === "subchapter"
        ? chapter?.subchapters.find((item) => item.id === target.subchapterId) ?? null
        : null;

    if (target.type === "chapter" && chapter) {
      return {
        title: chapter.title || "Éditeur de chapitre",
        subtitle: section ? `${section.title}` : "",
      };
    }

    if (target.type === "subchapter" && subchapter) {
      return {
        title: subchapter.title || "Éditeur de sous-chapitre",
        subtitle: chapter ? `${chapter.title}${section ? ` • ${section.title}` : ""}` : "",
      };
    }

    return { title: "Éditeur de contenu", subtitle: "" };
  }, [selection, sections]);

  return (
    <Card id="course-builder-modules" className="border border-slate-200 bg-white/95 text-black shadow-sm">
      <CardHeader className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-4">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">Structure, chapitres & contenus</CardTitle>
            <p className="text-sm leading-relaxed text-slate-600">
              Construisez une progression claire : chaque section introduit un chapitre, chaque chapitre peut se décliner en sous-chapitres pour rythmer l’apprentissage.
            </p>
          </div>
          {/* Actions rapides pour créer sections, chapitres, sous-chapitres */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={addSection}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <Plus className="h-3.5 w-3.5" /> Nouvelle section
            </Button>
            {sections.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (sections.length > 0) {
                      addChapter(sections[0].id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  <Plus className="h-3.5 w-3.5" /> Nouveau chapitre
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (sections.length > 0 && sections[0].chapters && sections[0].chapters.length > 0) {
                      addSubchapter(sections[0].id, sections[0].chapters[0].id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Plus className="h-3.5 w-3.5" /> Nouveau sous-chapitre
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Link href={previewLink}>Prévisualiser</Link>
          </Button>
          <Button
            onClick={addSection}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-indigo-600"
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter une section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <DndContext sensors={dragSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {sections.length ? (
                  sections.map((section) => (
                    <SectionCard key={section.id} section={section} selection={selection} />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                    Commencez par ajouter une section pour structurer votre formation.
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </CardContent>

      <Dialog
        open={Boolean(expandedSelection) && isEditorOpen}
        onOpenChange={(open) => (open ? setIsEditorOpen(true) : handleCloseEditor())}
      >
        <DialogContent className="w-full max-w-[1400px] sm:max-w-[92vw] md:max-w-[90vw] xl:max-w-[1400px] border border-slate-200 bg-white p-0 shadow-2xl">
          <DialogHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                {modalContext.title}
              </DialogTitle>
              {modalContext.subtitle ? (
                <DialogDescription className="text-sm text-slate-500">
                  {modalContext.subtitle}
                </DialogDescription>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseEditor}
              className="h-9 w-9 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="max-h-[calc(100vh-7rem)] min-h-[70vh] overflow-y-auto px-6 pb-6">
            <EditorPanel courseId={courseId} selectionOverride={expandedSelection} />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SectionCard({ section, selection }: { section: CourseBuilderSection; selection: BuilderSelection }) {
  const updateSection = useCourseBuilder((state) => state.updateSection);
  const removeSection = useCourseBuilder((state) => state.removeSection);
  const addChapter = useCourseBuilder((state) => state.addChapter);

  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition } = useSortable({
    id: section.id,
    data: { type: "section", sectionId: section.id },
  });
  const { setNodeRef: setSectionDropZoneRef } = useDroppable({
    id: `section-container-${section.id}`,
    data: { type: "section-container", sectionId: section.id },
  });
  const { setNodeRef: setChapterDropZoneRef } = useDroppable({
    id: `chapter-container-${section.id}`,
    data: { type: "chapter-container", sectionId: section.id },
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setSectionDropZoneRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-black shadow-sm transition hover:border-slate-300"
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="mt-2 rounded-full border border-slate-200 bg-white p-2 text-slate-400 transition hover:text-slate-600"
          aria-label="Réordonner la section"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] uppercase tracking-[0.25em]">
              Section
            </span>
            <span className="h-[1px] flex-1 rounded bg-slate-200" />
          </div>
          <Input
            value={section.title}
            onChange={(event) => updateSection(section.id, { title: event.target.value })}
            className="border-slate-200 bg-white text-base font-medium text-slate-900 placeholder:text-slate-400"
            placeholder="Titre de la section"
          />
          <Textarea
            value={section.description ?? ""}
            onChange={(event) => updateSection(section.id, { description: event.target.value })}
            placeholder="Décrivez la promesse ou la logique de cette section"
            className="min-h-[90px] resize-none border-slate-200 bg-white text-sm leading-relaxed text-slate-600 placeholder:text-slate-400"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => addChapter(section.id)}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-indigo-600"
            >
              <Plus className="mr-2 h-4 w-4" /> Ajouter un chapitre
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => removeSection(section.id)}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer la section
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <SortableContext
          id={`chapter-context-${section.id}`}
          items={section.chapters.map((chapter) => chapter.id)}
          strategy={verticalListSortingStrategy}
        >
          <div ref={setChapterDropZoneRef} className="space-y-3">
            {section.chapters.length ? (
              section.chapters.map((chapter) => (
                <ChapterCard key={chapter.id} sectionId={section.id} chapter={chapter} selection={selection} />
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-transparent px-4 py-3 text-sm text-slate-500">
                Ajoutez un chapitre pour démarrer la séquence de cette section.
              </p>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function ChapterCard({
  sectionId,
  chapter,
  selection,
}: {
  sectionId: string;
  chapter: CourseBuilderChapter;
  selection: BuilderSelection;
}) {
  const removeChapter = useCourseBuilder((state) => state.removeChapter);
  const addSubchapter = useCourseBuilder((state) => state.addSubchapter);
  const selectChapter = useCourseBuilder((state) => state.selectChapter);
  const selectSubchapter = useCourseBuilder((state) => state.selectSubchapter);
  const removeSubchapter = useCourseBuilder((state) => state.removeSubchapter);
  const updateChapter = useCourseBuilder((state) => state.updateChapter);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chapter.id,
    data: { type: "chapter", chapterId: chapter.id, sectionId },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isChapterSelected =
    selection && selection.sectionId === sectionId && selection.chapterId === chapter.id && selection.type === "chapter";
  const isWithinSelection =
    selection && selection.sectionId === sectionId && selection.chapterId === chapter.id && selection.type === "subchapter";

  const typeMeta = CONTENT_TYPE_MAP[chapter.type];

  const { setNodeRef: setSubchapterDropZoneRef } = useDroppable({
    id: `subchapter-container-${chapter.id}`,
    data: { type: "subchapter-container", chapterId: chapter.id, sectionId },
  });

  const handleAddSubchapter = () => addSubchapter(sectionId, chapter.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border border-slate-200 border-l-4 border-l-slate-200 bg-transparent p-5 transition",
        (isChapterSelected || isWithinSelection) && "border-slate-300 border-l-indigo-500 bg-white/80 shadow-sm",
      )}
      onClick={() => selectChapter(sectionId, chapter.id)}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="mt-1.5 rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:text-slate-600"
          aria-label="Réordonner le chapitre"
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Chapitre
            </span>
          </div>
          <div
            className={cn(
              "rounded-xl border border-slate-200 bg-white px-4 py-4 transition",
              (isChapterSelected || isWithinSelection) && "border-indigo-400 shadow-sm",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-1 items-start gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold uppercase text-slate-700">
                  C
                </span>
                <div className="flex-1 space-y-2">
                  <Input
                    value={chapter.title || ""}
                    onChange={(event) => updateChapter(sectionId, chapter.id, { title: event.target.value })}
                    onFocus={(event) => {
                      event.stopPropagation();
                      selectChapter(sectionId, chapter.id);
                    }}
                    onClick={(event) => event.stopPropagation()}
                    placeholder="Titre du chapitre"
                    className="border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
                  />
                  <p className="text-sm leading-relaxed text-slate-600">
                    {chapter.summary || "Décrivez la valeur de ce chapitre."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="rounded-md border border-indigo-100 bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                  {chapter.duration || "Durée ?"}
                </span>
                <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-600">
                  <typeMeta.icon className="h-3.5 w-3.5" />
                  {typeMeta.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleAddSubchapter();
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Ajouter un sous-chapitre
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                removeChapter(sectionId, chapter.id);
              }}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Retirer le chapitre
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <SortableContext
          id={`subchapter-context-${chapter.id}`}
          items={chapter.subchapters.map((sub) => sub.id)}
          strategy={verticalListSortingStrategy}
        >
          <div ref={setSubchapterDropZoneRef} className="space-y-2">
            {chapter.subchapters.length ? (
              chapter.subchapters.map((subchapter) => (
                <SubchapterRow
                  key={subchapter.id}
                  sectionId={sectionId}
                  chapterId={chapter.id}
                  subchapter={subchapter}
                  selection={selection}
                  onSelect={() => selectSubchapter(sectionId, chapter.id, subchapter.id)}
                  onRemove={() => removeSubchapter(sectionId, chapter.id, subchapter.id)}
                />
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-transparent px-4 py-3 text-xs text-slate-500">
                Ajoutez un sous-chapitre pour détailler la progression (obligatoire si le chapitre comporte plusieurs temps forts).
              </p>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function SubchapterRow({
  sectionId,
  chapterId,
  subchapter,
  selection,
  onSelect,
  onRemove,
}: {
  sectionId: string;
  chapterId: string;
  subchapter: CourseBuilderSubchapter;
  selection: BuilderSelection;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const updateSubchapter = useCourseBuilder((state) => state.updateSubchapter);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: subchapter.id,
    data: {
      type: "subchapter",
      sectionId,
      chapterId,
      subchapterId: subchapter.id,
    },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected =
    selection &&
    selection.type === "subchapter" &&
    selection.sectionId === sectionId &&
    selection.chapterId === chapterId &&
    selection.subchapterId === subchapter.id;

  const typeMeta = CONTENT_TYPE_MAP[subchapter.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition",
        isSelected && "border-indigo-500 bg-indigo-50 shadow-md",
      )}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="mt-1 rounded-full border border-slate-200 bg-white p-1 text-slate-400 transition hover:text-slate-600"
        aria-label="Réordonner le sous-chapitre"
        onClick={(event) => event.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-[10px] font-semibold uppercase text-indigo-700">
              Sub
            </span>
            <Input
              value={subchapter.title || ""}
              onChange={(event) => updateSubchapter(sectionId, chapterId, subchapter.id, { title: event.target.value })}
              onFocus={(event) => {
                event.stopPropagation();
                onSelect();
              }}
              onClick={(event) => event.stopPropagation()}
              placeholder="Titre du sous-chapitre"
              className="border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
              {subchapter.duration || ""}
            </span>
            <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
              <typeMeta.icon className="h-3 w-3" />
              {typeMeta.label}
            </span>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          {subchapter.summary || "Définissez la promesse et les livrables."}
        </p>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="mt-1 rounded-full border border-red-200 p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-600"
        aria-label="Supprimer le sous-chapitre"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EditorPanel({
  courseId,
  selectionOverride,
}: {
  courseId?: string;
  selectionOverride?: BuilderSelection | null;
}) {
  const sections = useCourseBuilder((state) => state.snapshot.sections);
  const storeSelection = useCourseBuilder((state) => state.selection);
  const updateChapter = useCourseBuilder((state) => state.updateChapter);
  const updateSubchapter = useCourseBuilder((state) => state.updateSubchapter);
  const addChapter = useCourseBuilder((state) => state.addChapter);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showSubchapterModal, setShowSubchapterModal] = useState(false);
  const [isOpenAIAvailable, setIsOpenAIAvailable] = useState(true);
  const [openAIMessage, setOpenAIMessage] = useState<string | null>(null);
  const [isGeneratingFlashcards, startFlashcardsTransition] = useTransition();
  const selection = selectionOverride ?? storeSelection;

  const nodes = useMemo(() => {
    if (!selection) return { section: null, chapter: null, subchapter: null };
    const section = sections.find((item) => item.id === selection.sectionId) ?? null;
    const chapter = section?.chapters.find((item) => item.id === selection.chapterId) ?? null;
    const subchapter =
      selection.type === "subchapter"
        ? chapter?.subchapters.find((item) => item.id === selection.subchapterId) ?? null
        : null;
    return { section, chapter, subchapter };
  }, [sections, selection]);

  let content: ReactNode = (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
      Sélectionnez un élément de la structure pour l'éditer.
    </div>
  );

  if (!selection || !nodes.chapter) {
    return <div className="flex h-full flex-col">{content}</div>;
  }

  if (selection.type === "chapter") {
    const meta = CONTENT_TYPE_MAP[nodes.chapter.type];
    content = (
      <EditorLayout
        title="Éditeur de chapitre"
        badge={meta.label}
        summaryPlaceholder="Résumez l'objectif et le livrable de ce chapitre."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setShowChapterModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-black bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-black hover:bg-black hover:text-white"
          >
            Créer le chapitre avec Beyond AI
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!nodes.chapter?.content || nodes.chapter.content.trim().length < 50) {
                toast.error("Le contenu du chapitre doit contenir au moins 50 caractères pour générer des flashcards");
                return;
              }

              startFlashcardsTransition(async () => {
                try {
                  const response = await fetch("/api/ai/generate-flashcards", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chapterContent: nodes.chapter!.content,
                      chapterTitle: nodes.chapter!.title || "Chapitre",
                      chapterId: nodes.chapter!.id, // ID local du chapitre
                      courseId: courseId, // ID du cours pour sauvegarder les flashcards
                    }),
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
                    const errorMessage = errorData.error || "Erreur lors de la génération";
                    const errorDetails = errorData.details ? `\n${errorData.details}` : "";
                    throw new Error(`${errorMessage}${errorDetails}`);
                  }

                  const data = await response.json();
                  if (!isOpenAIAvailable) {
                    setIsOpenAIAvailable(true);
                    setOpenAIMessage(null);
                  }

                  if (!data.success || !data.flashcards) {
                    throw new Error(data.error || "Réponse invalide de l'API");
                  }

                  if (data.saved && data.savedCount > 0) {
                    toast.success(`${data.flashcards.length} flashcard(s) générée(s) et sauvegardée(s)`, {
                      description: `${data.savedCount} flashcard(s) ont été automatiquement ajoutées au chapitre.`,
                    });
                    // Déclencher un événement pour afficher les flashcards immédiatement
                    window.dispatchEvent(new CustomEvent('flashcards-created', { 
                      detail: { 
                        flashcards: data.flashcards,
                        savedFlashcards: data.savedFlashcards || [],
                        chapterId: data.chapterId
                      } 
                    }));
                  } else {
                    toast.success(`${data.flashcards.length} flashcard(s) générée(s)`, {
                      description: "Les flashcards ont été générées mais seront sauvegardées quand le chapitre sera enregistré.",
                    });
                    // Afficher quand même les flashcards même si elles ne sont pas sauvegardées
                    window.dispatchEvent(new CustomEvent('flashcards-created', { 
                      detail: { 
                        flashcards: data.flashcards,
                        savedFlashcards: [],
                        chapterId: null
                      } 
                    }));
                  }

                  console.log("Generated flashcards:", data.flashcards);
                } catch (error) {
                  console.error("[ai] Error generating flashcards", error);
                  const errorMessage = error instanceof Error ? error.message : "Erreur lors de la génération";
                  if (errorMessage.toLowerCase().includes("openai")) {
                    setIsOpenAIAvailable(false);
                    setOpenAIMessage("Clé OpenAI manquante. Ajoutez OPENAI_API_KEY côté serveur.");
                  }
                  toast.error("Erreur lors de la création des flashcards", {
                    description: errorMessage,
                    duration: 5000,
                  });
                }
              });
            }}
            disabled={
              isGeneratingFlashcards ||
              !nodes.chapter?.content ||
              nodes.chapter.content.trim().length < 50 ||
              !isOpenAIAvailable
            }
            className="rounded-full border border-black bg-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white hover:bg-black/85 disabled:opacity-50"
          >
            {isGeneratingFlashcards ? "Génération..." : "Créer des flashcards"}
          </Button>
        </div>
        {openAIMessage ? (
          <div className="mt-2 rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-200">
            {openAIMessage}
          </div>
        ) : null}
        {showChapterModal && selection && (
          <ChapterGenerationModal
            open={showChapterModal}
            onOpenChange={setShowChapterModal}
            sectionId={selection.sectionId}
            chapterId={selection.type === "chapter" ? selection.chapterId : undefined}
            courseId={courseId}
          />
        )}
        <Input
          value={nodes.chapter.title}
          onChange={(event) => updateChapter(selection.sectionId, selection.chapterId, { title: event.target.value })}
          placeholder="Titre du chapitre"
          className="border-slate-200 bg-white text-sm text-black placeholder:text-slate-400"
        />
        <div className="grid gap-3 md:grid-cols-[160px_1fr]">
          <Input
            value={nodes.chapter.duration}
            onChange={(event) => updateChapter(selection.sectionId, selection.chapterId, { duration: event.target.value })}
            placeholder="Durée / format"
            className="border-slate-200 bg-white text-sm text-black placeholder:text-slate-400"
          />
          <ContentTypeSelect
            value={nodes.chapter.type}
            onChange={(value) => updateChapter(selection.sectionId, selection.chapterId, { type: value })}
          />
        </div>
        <Textarea
          value={nodes.chapter.summary ?? ""}
          onChange={(event) => updateChapter(selection.sectionId, selection.chapterId, { summary: event.target.value })}
          placeholder="Résumé pédagogique, bénéfices et livrables du chapitre."
          className="min-h-[120px] resize-none border-slate-200 bg-white text-sm text-black placeholder:text-slate-400"
        />
        
        {/* Éditeur selon le type de contenu */}
        {(nodes.chapter.type === "video" || nodes.chapter.type === "audio") ? (
          <MediaUploader
            value={nodes.chapter.content ?? ""}
            onChange={(url) => updateChapter(selection.sectionId, selection.chapterId, { content: url })}
            mediaType={nodes.chapter.type}
          />
        ) : (
          <RichTextEditor
            content={nodes.chapter.content ?? ""}
            onChange={(html) => updateChapter(selection.sectionId, selection.chapterId, { content: html })}
            placeholder="Insérez ici votre script, vos ressources, les consignes détaillées ou tout contenu textuel."
          />
        )}

        {/* Gestionnaire de flashcards */}
        <FlashcardsManager courseId={courseId} chapterId={nodes.chapter?.id} />
      </EditorLayout>
    );
  } else if (selection.type === "subchapter" && nodes.subchapter) {
    const meta = CONTENT_TYPE_MAP[nodes.subchapter.type];
    content = (
      <EditorLayout
        title="Éditeur de sous-chapitre"
        badge={meta.label}
        summaryPlaceholder="Décrivez l'expérience, les actions ou les livrables de ce sous-chapitre."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setShowSubchapterModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-black bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-black hover:bg-black hover:text-white"
          >
            Créer le sous-chapitre avec Beyond AI
          </Button>
        </div>
        <SubchapterGenerationModal
          open={showSubchapterModal}
          onOpenChange={setShowSubchapterModal}
          sectionId={selection.sectionId}
          chapterId={selection.chapterId}
          subchapterId={selection.subchapterId}
          chapterTitle={nodes.chapter?.title}
          courseId={courseId}
        />
        <Input
          value={nodes.subchapter.title}
          onChange={(event) =>
            updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
              title: event.target.value,
            })
          }
          placeholder="Titre du sous-chapitre"
          className="border-slate-200 bg-white text-sm text-black placeholder:text-slate-400"
        />
        <div className="grid gap-3 md:grid-cols-[160px_1fr]">
          <Input
            value={nodes.subchapter.duration}
            onChange={(event) =>
              updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
                duration: event.target.value,
              })
            }
            placeholder="Durée / format"
            className="border-slate-200 bg-white text-sm text-black placeholder:text-slate-400"
          />
          <ContentTypeSelect
            value={nodes.subchapter.type}
            onChange={(value) =>
              updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, { type: value })
            }
          />
        </div>
        <Textarea
          value={nodes.subchapter.summary ?? ""}
          onChange={(event) =>
            updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
              summary: event.target.value,
            })
          }
          placeholder="Résumé synthétique, livrables, points clés."
          className="min-h-[120px] resize-none border-slate-200 bg-white text-sm text-black placeholder:text-slate-400"
        />
        
        {/* Éditeur selon le type de contenu */}
        {(nodes.subchapter.type === "video" || nodes.subchapter.type === "audio") ? (
          <MediaUploader
            value={nodes.subchapter.content ?? ""}
            onChange={(url) =>
              updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
                content: url,
              })
            }
            mediaType={nodes.subchapter.type}
          />
        ) : (
          <RichTextEditor
            content={nodes.subchapter.content ?? ""}
            onChange={(html) =>
              updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
                content: html,
              })
            }
            placeholder="Contenu détaillé, script, liens vers ressources, instructions pas-à-pas."
          />
        )}

        {/* Gestionnaire de flashcards */}
        <FlashcardsManager courseId={courseId} chapterId={nodes.chapter?.id} />
      </EditorLayout>
    );
  }

  return <div className="flex h-full flex-col">{content}</div>;
}

function EditorLayout({
  title,
  badge,
  children,
  summaryPlaceholder,
}: {
  title: string;
  badge: string;
  children: ReactNode;
  summaryPlaceholder: string;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{title}</p>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-black" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-slate-600">{badge}</span>
        </div>
        <p className="text-xs text-slate-500">{summaryPlaceholder}</p>
      </header>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ContentTypeSelect({ value, onChange }: { value: BuilderContentType; onChange: (value: BuilderContentType) => void }) {
  const Selected = CONTENT_TYPE_MAP[value]?.icon;
  return (
    <Select value={value} onValueChange={(val) => onChange(val as BuilderContentType)}>
      <SelectTrigger className="border-slate-200 bg-white text-sm text-black">
        <SelectValue>
          <div className="flex items-center gap-2">
            {Selected ? <Selected className="h-4 w-4" /> : null}
            <span>{CONTENT_TYPE_MAP[value]?.label ?? "Type"}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border border-slate-200 bg-white text-black">
        {CONTENT_TYPE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-black">
            <span className="flex items-center gap-2">
              <option.icon className="h-4 w-4" />
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


