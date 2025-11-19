"use client";

import Link from "next/link";
import { type ReactNode, useMemo, useState, useTransition } from "react";

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

import { Sparkles } from "lucide-react";
import { ChapterGenerationModal } from "@/components/formateur/ai/chapter-generation-modal";
import { SubchapterGenerationModal } from "@/components/formateur/ai/subchapter-generation-modal";
import { CourseStructureGeneratorModal } from "@/components/formateur/ai/course-structure-generator-modal";
import { toast } from "sonner";
import { RichTextEditor } from "./rich-text-editor";
import { MediaUploader } from "./media-uploader";
import { FlashcardsManager } from "./flashcards-manager";

type ContentTypeOption = {
  value: BuilderContentType;
  label: string;
  icon: typeof Clapperboard;
  accent: string;
};

const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  { value: "video", label: "Vidéo", icon: Clapperboard, accent: "from-[#00C6FF] to-[#0072FF]" },
  { value: "audio", label: "Audio", icon: Headphones, accent: "from-[#FF512F] to-[#DD2476]" },
  { value: "document", label: "Document", icon: FileText, accent: "from-[#8E2DE2] to-[#4A00E0]" },
  { value: "text", label: "Texte", icon: Text, accent: "from-[#6EE7B7] to-[#3B82F6]" },
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
  const [isStructureGeneratorOpen, setIsStructureGeneratorOpen] = useState(false);

  const previewLink = previewHref ?? "/dashboard/formateur/formations/new/preview";

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

  const getTargetSectionId = () => {
    if (selection?.sectionId && sections.some((section) => section.id === selection.sectionId)) {
      return selection.sectionId;
    }
    return sections[0]?.id ?? null;
  };

  const handleAddSectionFloating = () => {
    addSection();
  };

  const handleAddChapterFloating = () => {
    const sectionId = getTargetSectionId();
    if (!sectionId) {
      toast.error("Ajoutez d'abord une section");
      return;
    }
    addChapter(sectionId);
  };

  const handleAddSubchapterFloating = () => {
    const sectionId = getTargetSectionId();
    if (!sectionId) {
      toast.error("Ajoutez d'abord une section");
      return;
    }

    const section = sections.find((sectionItem) => sectionItem.id === sectionId);
    const chapterId =
      (selection?.type === "chapter" && selection.chapterId) ||
      (selection?.type === "subchapter" && selection.chapterId) ||
      section?.chapters?.[0]?.id;

    if (!chapterId) {
      toast.error("Ajoutez d'abord un chapitre");
      return;
    }

    addSubchapter(sectionId, chapterId);
  };

  return (
    <Card id="course-builder-modules" className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div>
            <CardTitle className="text-lg font-semibold">Structure, chapitres & contenus</CardTitle>
            <p className="text-sm text-white/60">
              Segmentez votre parcours avec des sections, chapitres et sous-chapitres. Chaque étape dispose de son propre contenu.
            </p>
          </div>
          {/* Actions rapides pour créer sections, chapitres, sous-chapitres et IA */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={addSection}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(0,114,255,0.3)] hover:opacity-90"
            >
              <Plus className="h-3 w-3" /> Section
            </Button>
            {sections.length > 0 && (
              <>
                <Button
                  onClick={() => {
                    // Ajouter un chapitre à la première section disponible
                    if (sections.length > 0) {
                      addChapter(sections[0].id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#8E2DE2] via-[#6A4BFF] to-[#4A00E0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(110,43,255,0.4)] hover:opacity-90"
                >
                  <Plus className="h-3 w-3" /> Chapitre
                </Button>
                <Button
                  onClick={() => {
                    // Ajouter un sous-chapitre au premier chapitre de la première section
                    if (sections.length > 0 && sections[0].chapters && sections[0].chapters.length > 0) {
                      addSubchapter(sections[0].id, sections[0].chapters[0].id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(255,81,47,0.3)] hover:opacity-90"
                >
                  <Plus className="h-3 w-3" /> Sous-chapitre
                </Button>
              </>
            )}
            <Button
              onClick={() => setIsStructureGeneratorOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFE29F] via-[#FFA99F] to-[#FF719A] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black shadow-[0_4px_12px_rgba(255,153,156,0.3)] hover:opacity-90"
            >
              <Sparkles className="h-3 w-3" /> Créer depuis un référentiel
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_40px_rgba(255,81,47,0.35)] hover:opacity-90"
          >
            <Link href={previewLink}>Prévisualiser</Link>
          </Button>
          <Button
            onClick={addSection}
            className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_40px_rgba(0,114,255,0.35)] hover:opacity-90"
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> Ajouter une section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] 2xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.85fr)]">
          <div className="space-y-4">
            <DndContext sensors={dragSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {sections.length ? (
                    sections.map((section) => (
                      <SectionCard key={section.id} section={section} selection={selection} />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-transparent px-6 py-10 text-center text-sm text-white/60">
                      Commencez par ajouter une section pour structurer votre formation.
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <EditorPanel courseId={courseId} />
        </div>
      </CardContent>
      <CourseStructureGeneratorModal
        open={isStructureGeneratorOpen}
        onOpenChange={setIsStructureGeneratorOpen}
      />
      <div className="pointer-events-none">
        <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-2 pointer-events-auto">
          <Button
            onClick={handleAddSectionFloating}
            className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_10px_30px_rgba(15,23,42,0.4)] backdrop-blur hover:bg-white/20"
          >
            Ajouter une section
          </Button>
          <Button
            onClick={handleAddChapterFloating}
            className="rounded-full border border-white/25 bg-gradient-to-r from-[#4A00E0]/80 via-[#6A4BFF]/80 to-[#8E2DE2]/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_32px_rgba(110,43,255,0.45)] hover:opacity-90"
          >
            Ajouter un chapitre
          </Button>
          <Button
            onClick={handleAddSubchapterFloating}
            className="rounded-full border border-white/25 bg-gradient-to-r from-[#FF512F] via-[#F76B1C] to-[#DD2476] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_32px_rgba(255,81,47,0.45)] hover:opacity-90"
          >
            Ajouter un sous-chapitre
          </Button>
        </div>
      </div>
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
      className="rounded-3xl border border-white/15 bg-black/80 p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.45)] transition hover:border-white/30"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="mt-2 rounded-full border border-white/20 bg-white/5 p-2 text-white/40 transition hover:text-white"
          aria-label="Réordonner la section"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 space-y-3">
          <Input
            value={section.title}
            onChange={(event) => updateSection(section.id, { title: event.target.value })}
            className="bg-white/5 text-sm text-white placeholder:text-white/30"
            placeholder="Titre de la section"
          />
          <Textarea
            value={section.description ?? ""}
            onChange={(event) => updateSection(section.id, { description: event.target.value })}
            placeholder="Décrivez la promesse ou la logique de cette section"
            className="min-h-[80px] resize-none bg-white/5 text-sm text-white placeholder:text-white/30"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => addChapter(section.id)}
              className="rounded-full bg-gradient-to-r from-[#8E2DE2] via-[#6A4BFF] to-[#4A00E0] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_40px_rgba(110,43,255,0.45)] hover:opacity-90"
            >
              <Plus className="mr-2 h-3.5 w-3.5" /> Ajouter un chapitre
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => removeSection(section.id)}
              className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
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
              <p className="rounded-2xl border border-dashed border-white/15 bg-transparent px-4 py-3 text-sm text-white/50">
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
        "rounded-2xl border border-white/10 bg-white/5 p-4 transition",
        (isChapterSelected || isWithinSelection) && "border-white/30 bg-white/10 shadow-[0_10px_40px_rgba(14,116,255,0.35)]",
      )}
      onClick={() => selectChapter(sectionId, chapter.id)}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="mt-1.5 rounded-full border border-white/20 bg-white/10 p-1.5 text-white/60 transition hover:text-white"
          aria-label="Réordonner le chapitre"
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 space-y-3">
          <div
            className={cn(
              "rounded-xl border border-white/15 bg-white/5 px-4 py-3 transition",
              (isChapterSelected || isWithinSelection) && "border-white/40 bg-white/10 shadow-[0_10px_40px_rgba(14,116,255,0.35)]",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-1 items-start gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold uppercase text-white shadow-[0_6px_16px_rgba(15,23,42,0.24)]">
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
                    className="bg-white/10 border-white/20 text-sm text-white placeholder:text-white/40 focus-visible:ring-white/40"
                  />
                  <p className="text-xs text-white/60">
                    {chapter.summary || "Décrivez la valeur de ce chapitre."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.25em]">
                  {chapter.duration || "Durée ?"}
                </span>
                <span className="flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.25em]">
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
              className="rounded-full bg-gradient-to-r from-[#FF512F] via-[#F76B1C] to-[#DD2476] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_40px_rgba(255,81,47,0.4)] hover:opacity-90"
            >
              <Plus className="mr-2 h-3.5 w-3.5" /> Sous-chapitre
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                removeChapter(sectionId, chapter.id);
              }}
              className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Retirer
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
              <p className="rounded-2xl border border-dashed border-white/15 bg-transparent px-4 py-3 text-xs text-white/50">
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
        "flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 px-3 py-3 text-sm text-white transition",
        isSelected && "border-white/45 bg-white/10 shadow-[0_12px_38px_rgba(62,140,255,0.35)]",
      )}
      onClick={onSelect}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="mt-1 rounded-full border border-white/20 bg-white/10 p-1 text-white/60 transition hover:text-white"
        aria-label="Réordonner le sous-chapitre"
        onClick={(event) => event.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold uppercase text-white shadow-[0_6px_14px_rgba(15,23,42,0.22)]">
              SC
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
              className="bg-white/10 border-white/20 text-xs text-white placeholder:text-white/40 focus-visible:ring-white/40"
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/70">
            <span className="rounded-full border border-white/20 px-2 py-1 text-white/75">{subchapter.duration || ""}</span>
            <span className="flex items-center gap-1 rounded-full border border-white/20 px-2 py-1 text-white/75">
              <typeMeta.icon className="h-3 w-3" />
              {typeMeta.label}
            </span>
          </div>
        </div>
        <p className="text-xs text-white/60">
          {subchapter.summary || "Définissez la promesse et les livrables."}
        </p>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="mt-1 rounded-full border border-white/20 p-1.5 text-white/50 transition hover:text-white"
        aria-label="Supprimer le sous-chapitre"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EditorPanel({ courseId }: { courseId?: string }) {
  const sections = useCourseBuilder((state) => state.snapshot.sections);
  const selection = useCourseBuilder((state) => state.selection);
  const updateChapter = useCourseBuilder((state) => state.updateChapter);
  const updateSubchapter = useCourseBuilder((state) => state.updateSubchapter);
  const addChapter = useCourseBuilder((state) => state.addChapter);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [isGeneratingFlashcards, startFlashcardsTransition] = useTransition();

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
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-white/50">
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
        accent={meta.accent}
        summaryPlaceholder="Résumez l'objectif et le livrable de ce chapitre."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setShowChapterModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00F5A0] via-[#00D9F5] to-[#0068F5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-black shadow-[0_8px_24px_rgba(0,213,245,0.4)] hover:opacity-90"
          >
            <Sparkles className="h-3 w-3" /> Créer le chapitre avec Beyond AI
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

                  if (!data.success || !data.flashcards) {
                    throw new Error(data.error || "Réponse invalide de l'API");
                  }

                  if (data.saved && data.savedCount > 0) {
                    toast.success(`${data.flashcards.length} flashcard(s) générée(s) et sauvegardée(s)`, {
                      description: `${data.savedCount} flashcard(s) ont été automatiquement ajoutées au chapitre.`,
                    });
                  } else {
                    toast.success(`${data.flashcards.length} flashcard(s) générée(s)`, {
                      description: "Les flashcards ont été générées mais n'ont pas pu être sauvegardées automatiquement.",
                    });
                  }

                  console.log("Generated flashcards:", data.flashcards);
                } catch (error) {
                  console.error("[ai] Error generating flashcards", error);
                  const errorMessage = error instanceof Error ? error.message : "Erreur lors de la génération";
                  toast.error("Erreur lors de la création des flashcards", {
                    description: errorMessage,
                    duration: 5000,
                  });
                }
              });
            }}
            disabled={isGeneratingFlashcards || !nodes.chapter?.content || nodes.chapter.content.trim().length < 50}
            className="rounded-full bg-gradient-to-r from-[#FF8F70] via-[#FF3D68] to-[#DD2476] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white shadow-[0_8px_24px_rgba(255,61,104,0.4)] hover:opacity-90 disabled:opacity-50"
          >
            {isGeneratingFlashcards ? "Génération..." : "Créer des flashcards"}
          </Button>
        </div>
        {showChapterModal && selection && (
          <ChapterGenerationModal
            open={showChapterModal}
            onOpenChange={setShowChapterModal}
            sectionId={selection.sectionId}
            chapterId={selection.type === "chapter" ? selection.chapterId : undefined}
          />
        )}
        <Input
          value={nodes.chapter.title}
          onChange={(event) => updateChapter(selection.sectionId, selection.chapterId, { title: event.target.value })}
          placeholder="Titre du chapitre"
          className="bg-black/40 text-sm text-white placeholder:text-white/30"
        />
        <div className="grid gap-3 md:grid-cols-[160px_1fr]">
          <Input
            value={nodes.chapter.duration}
            onChange={(event) => updateChapter(selection.sectionId, selection.chapterId, { duration: event.target.value })}
            placeholder="Durée / format"
            className="bg-black/40 text-sm text-white placeholder:text-white/30"
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
          className="min-h-[120px] resize-none bg-black/40 text-sm text-white placeholder:text-white/30"
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
    const [showSubchapterModal, setShowSubchapterModal] = useState(false);
    content = (
      <EditorLayout
        title="Éditeur de sous-chapitre"
        badge={meta.label}
        accent={meta.accent}
        summaryPlaceholder="Décrivez l'expérience, les actions ou les livrables de ce sous-chapitre."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setShowSubchapterModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00F5A0] via-[#00D9F5] to-[#0068F5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-black shadow-[0_8px_24px_rgba(0,213,245,0.4)] hover:opacity-90"
          >
            <Sparkles className="h-3 w-3" /> Créer le sous-chapitre avec Beyond AI
          </Button>
        </div>
        <SubchapterGenerationModal
          open={showSubchapterModal}
          onOpenChange={setShowSubchapterModal}
          sectionId={selection.sectionId}
          chapterId={selection.chapterId}
          subchapterId={selection.subchapterId}
          chapterTitle={nodes.chapter?.title}
        />
        <Input
          value={nodes.subchapter.title}
          onChange={(event) =>
            updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
              title: event.target.value,
            })
          }
          placeholder="Titre du sous-chapitre"
          className="bg-black/40 text-sm text-white placeholder:text-white/30"
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
            className="bg-black/40 text-sm text-white placeholder:text-white/30"
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
          className="min-h-[120px] resize-none bg-black/40 text-sm text-white placeholder:text-white/30"
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
  accent,
  children,
  summaryPlaceholder,
}: {
  title: string;
  badge: string;
  accent: string;
  children: ReactNode;
  summaryPlaceholder: string;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B0B0F] via-[#111] to-[#050505] p-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">{title}</p>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <span className={cn("h-2 w-2 rounded-full", `bg-gradient-to-r ${accent}`)} />
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">{badge}</span>
        </div>
        <p className="text-xs text-white/50">{summaryPlaceholder}</p>
      </header>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ContentTypeSelect({ value, onChange }: { value: BuilderContentType; onChange: (value: BuilderContentType) => void }) {
  const Selected = CONTENT_TYPE_MAP[value]?.icon;
  return (
    <Select value={value} onValueChange={(val) => onChange(val as BuilderContentType)}>
      <SelectTrigger className="bg-black/40 text-sm text-white">
        <SelectValue>
          <div className="flex items-center gap-2">
            {Selected ? <Selected className="h-4 w-4" /> : null}
            <span>{CONTENT_TYPE_MAP[value]?.label ?? "Type"}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-[#0F172A] text-white">
        {CONTENT_TYPE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-white">
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


