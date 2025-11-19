"use client";

import Link from "next/link";
import { type ReactNode, useMemo, useState, useTransition } from "react";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
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
import { CourseStructureGeneratorModalSuperAdmin } from "@/components/super-admin/ai/course-structure-generator-modal-super-admin";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/formateur/course-builder/rich-text-editor";
import { MediaUploader } from "@/components/formateur/course-builder/media-uploader";

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

export function CourseStructureBuilderSuperAdmin({ previewHref }: { previewHref?: string }) {
  const sections = useCourseBuilder((state) => state.snapshot.sections);
  const selection = useCourseBuilder((state) => state.selection);
  const addSection = useCourseBuilder((state) => state.addSection);
  const reorderSections = useCourseBuilder((state) => state.reorderSections);
  const addChapter = useCourseBuilder((state) => state.addChapter);
  const addSubchapter = useCourseBuilder((state) => state.addSubchapter);
  const [isStructureGeneratorOpen, setIsStructureGeneratorOpen] = useState(false);

  const previewLink = previewHref ?? "/super/studio/modules/new/preview";

  const sectionSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderSections(String(active.id), String(over.id));
  };

  return (
    <Card id="course-builder-modules" className="border-black bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Structure, chapitres & contenus</CardTitle>
            <p className="text-sm text-gray-600">
              Segmentez votre parcours avec des sections, chapitres et sous-chapitres. Chaque étape dispose de son propre contenu.
            </p>
          </div>
          {/* Actions rapides pour créer sections, chapitres, sous-chapitres et IA */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={addSection}
              className="inline-flex items-center gap-1.5 rounded-full bg-black text-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-gradient-to-r hover:from-[#00C6FF] hover:to-[#0072FF] transition-all"
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-black text-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-gradient-to-r hover:from-[#8E2DE2] hover:via-[#6A4BFF] hover:to-[#4A00E0] transition-all"
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-black text-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-gradient-to-r hover:from-[#FF512F] hover:to-[#DD2476] transition-all"
                >
                  <Plus className="h-3 w-3" /> Sous-chapitre
                </Button>
              </>
            )}
            <Button
              onClick={() => setIsStructureGeneratorOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black text-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-gradient-to-r hover:from-[#FFE29F] hover:via-[#FFA99F] hover:to-[#FF719A] hover:text-black transition-all"
            >
              <Sparkles className="h-3 w-3" /> Créer depuis un référentiel
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            className="rounded-full bg-black text-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-gradient-to-r hover:from-[#FF512F] hover:to-[#DD2476] transition-all"
          >
            <Link href={previewLink}>Prévisualiser</Link>
          </Button>
          <Button
            onClick={addSection}
            className="rounded-full bg-black text-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-gradient-to-r hover:from-[#00C6FF] hover:to-[#0072FF] transition-all"
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> Ajouter une section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] 2xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.85fr)]">
          <div className="space-y-4">
            <DndContext sensors={sectionSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
              <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {sections.length ? (
                    sections.map((section) => (
                      <SectionCard key={section.id} section={section} selection={selection} />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black bg-transparent px-6 py-10 text-center text-sm text-gray-600">
                      Commencez par ajouter une section pour structurer votre formation.
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <EditorPanel />
        </div>
      </CardContent>
      <CourseStructureGeneratorModalSuperAdmin
        open={isStructureGeneratorOpen}
        onOpenChange={setIsStructureGeneratorOpen}
      />
    </Card>
  );
}

function SectionCard({ section, selection }: { section: CourseBuilderSection; selection: BuilderSelection }) {
  const updateSection = useCourseBuilder((state) => state.updateSection);
  const removeSection = useCourseBuilder((state) => state.removeSection);
  const addChapter = useCourseBuilder((state) => state.addChapter);
  const reorderChapters = useCourseBuilder((state) => state.reorderChapters);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const chapterSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleChapterDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderChapters(section.id, String(active.id), String(over.id));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-3xl border border-white/15 bg-black/85 p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.45)] transition hover:border-white/25 hover:shadow-[0_24px_70px_rgba(15,23,42,0.55)]"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="mt-2 rounded-full border border-white/25 bg-white/10 p-2 text-white/50 transition hover:text-white"
          aria-label="Réordonner la section"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 space-y-3">
          <Input
            value={section.title}
            onChange={(event) => updateSection(section.id, { title: event.target.value })}
            className="border border-white/25 bg-white/10 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:bg-white/15"
            placeholder="Titre de la section"
          />
          <Textarea
            value={section.description ?? ""}
            onChange={(event) => updateSection(section.id, { description: event.target.value })}
            placeholder="Décrivez la promesse ou la logique de cette section"
            className="min-h-[80px] resize-none border border-white/25 bg-white/10 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:bg-white/15"
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
              className="rounded-full border border-white/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/45 hover:text-white"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <DndContext sensors={chapterSensors} collisionDetection={closestCenter} onDragEnd={handleChapterDragEnd}>
          <SortableContext items={section.chapters.map((chapter) => chapter.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {section.chapters.length ? (
                section.chapters.map((chapter) => (
                  <ChapterCard key={chapter.id} sectionId={section.id} chapter={chapter} selection={selection} />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-white/20 bg-transparent px-4 py-3 text-sm text-white/60">
                  Ajoutez un chapitre pour démarrer la séquence de cette section.
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
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
  const reorderSubchapters = useCourseBuilder((state) => state.reorderSubchapters);
  const selectSubchapter = useCourseBuilder((state) => state.selectSubchapter);
  const removeSubchapter = useCourseBuilder((state) => state.removeSubchapter);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chapter.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isChapterSelected =
    selection && selection.sectionId === sectionId && selection.chapterId === chapter.id && selection.type === "chapter";
  const isWithinSelection =
    selection && selection.sectionId === sectionId && selection.chapterId === chapter.id && selection.type === "subchapter";

  const typeMeta = CONTENT_TYPE_MAP[chapter.type];

  const subchapterSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleSubchapterDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderSubchapters(sectionId, chapter.id, String(active.id), String(over.id));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border border-black bg-white p-4 transition",
        (isChapterSelected || isWithinSelection) && "border-black bg-gray-50 shadow-md",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="mt-1.5 rounded-full border border-black bg-gray-50 p-1.5 text-gray-700 transition hover:text-gray-900"
          aria-label="Réordonner le chapitre"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 space-y-3">
          <button
            type="button"
            onClick={() => selectChapter(sectionId, chapter.id)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border border-black bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100",
              isChapterSelected && "bg-gray-100",
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold uppercase text-white shadow-[0_8px_18px_rgba(15,23,42,0.2)]">
                C
              </span>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Chapitre</p>
                <p className="text-sm font-semibold text-gray-900">{chapter.title || "Titre du chapitre"}</p>
                <p className="text-xs text-gray-600">{chapter.summary || "Décrivez la valeur de ce chapitre."}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="rounded-full border border-black px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-gray-700">
                {chapter.duration || "Durée ?"}
              </span>
              <span className="flex items-center gap-1 rounded-full border border-black px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-gray-700">
                <typeMeta.icon className="h-3.5 w-3.5" />
                {typeMeta.label}
              </span>
            </div>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => addSubchapter(sectionId, chapter.id)}
              className="rounded-full bg-black text-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-gradient-to-r hover:from-[#FF512F] hover:via-[#F76B1C] hover:to-[#DD2476] transition-all"
            >
              <Plus className="mr-2 h-3.5 w-3.5" /> Sous-chapitre
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => removeChapter(sectionId, chapter.id)}
              className="rounded-full border border-black px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Retirer
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <DndContext sensors={subchapterSensors} collisionDetection={closestCenter} onDragEnd={handleSubchapterDragEnd}>
          <SortableContext items={chapter.subchapters.map((sub) => sub.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
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
                <p className="rounded-2xl border border-dashed border-black bg-transparent px-4 py-3 text-xs text-gray-600">
                  Ajoutez un sous-chapitre pour détailler la progression (obligatoire si le chapitre comporte plusieurs temps forts).
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
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
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: subchapter.id });
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
        "flex items-start gap-3 rounded-2xl border border-black bg-white px-3 py-3 text-sm text-gray-900 transition",
        isSelected && "border-black bg-gray-50 shadow-md",
      )}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="mt-1 rounded-full border border-black bg-gray-50 p-1 text-gray-700 transition hover:text-gray-900"
        aria-label="Réordonner le sous-chapitre"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 items-start justify-between gap-3 text-left"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[10px] font-semibold uppercase text-white shadow-[0_6px_16px_rgba(15,23,42,0.22)]">
            SC
          </span>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Sous-chapitre</p>
            <p className="text-xs font-semibold text-gray-900">{subchapter.title || "Titre du sous-chapitre"}</p>
            <p className="text-xs text-gray-600">{subchapter.summary || "Définissez la promesse et les livrables."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gray-600">
          <span className="rounded-full border border-black px-2 py-1 text-gray-700">{subchapter.duration || ""}</span>
          <span className="flex items-center gap-1 rounded-full border border-black px-2 py-1 text-gray-700">
            <typeMeta.icon className="h-3 w-3" />
            {typeMeta.label}
          </span>
        </div>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="mt-1 rounded-full border border-black p-1.5 text-gray-700 transition hover:text-gray-900"
        aria-label="Supprimer le sous-chapitre"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EditorPanel() {
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
    <div className="rounded-3xl border border-dashed border-black bg-gray-50 p-6 text-center text-sm text-gray-600">
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
            className="inline-flex items-center gap-2 rounded-full bg-black text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] hover:bg-gradient-to-r hover:from-[#00F5A0] hover:via-[#00D9F5] hover:to-[#0068F5] hover:text-black transition-all"
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
                      chapterId: nodes.chapter!.id, // Passer l'ID du chapitre pour sauvegarder
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
            className="rounded-full bg-black text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] hover:bg-gradient-to-r hover:from-[#FF8F70] hover:via-[#FF3D68] hover:to-[#DD2476] transition-all disabled:opacity-50"
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
          className="bg-gray-50 border-black text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
        />
        <div className="grid gap-3 md:grid-cols-[160px_1fr]">
          <Input
            value={nodes.chapter.duration}
            onChange={(event) => updateChapter(selection.sectionId, selection.chapterId, { duration: event.target.value })}
            placeholder="Durée / format"
            className="bg-gray-50 border-black text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
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
          className="min-h-[120px] resize-none bg-gray-50 border-black text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
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
      </EditorLayout>
    );
  } else if (selection.type === "subchapter" && nodes.subchapter) {
    const meta = CONTENT_TYPE_MAP[nodes.subchapter.type];
    content = (
      <EditorLayout
        title="Éditeur de sous-chapitre"
        badge={meta.label}
        accent={meta.accent}
        summaryPlaceholder="Décrivez l'expérience, les actions ou les livrables de ce sous-chapitre."
      >
        <Input
          value={nodes.subchapter.title}
          onChange={(event) =>
            updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
              title: event.target.value,
            })
          }
          placeholder="Titre du sous-chapitre"
          className="bg-gray-50 border-black text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
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
            className="bg-gray-50 border-black text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
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
          className="min-h-[120px] resize-none bg-gray-50 border-black text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
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
    <div className="space-y-4 rounded-3xl border border-black bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-500">{title}</p>
        <div className="inline-flex items-center gap-2 rounded-full border border-black bg-gray-50 px-3 py-1">
          <span className={cn("h-2 w-2 rounded-full", `bg-gradient-to-r ${accent}`)} />
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-700">{badge}</span>
        </div>
        <p className="text-xs text-gray-600">{summaryPlaceholder}</p>
      </header>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ContentTypeSelect({ value, onChange }: { value: BuilderContentType; onChange: (value: BuilderContentType) => void }) {
  const Selected = CONTENT_TYPE_MAP[value]?.icon;
  return (
    <Select value={value} onValueChange={(val) => onChange(val as BuilderContentType)}>
      <SelectTrigger className="bg-gray-50 border-black text-sm text-gray-900">
        <SelectValue>
          <div className="flex items-center gap-2">
            {Selected ? <Selected className="h-4 w-4" /> : null}
            <span>{CONTENT_TYPE_MAP[value]?.label ?? "Type"}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white border-black">
        {CONTENT_TYPE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-gray-900">
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


