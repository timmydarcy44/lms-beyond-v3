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
  CircleCheck,
  Clapperboard,
  ChevronDown,
  FileText,
  GripVertical,
  Headphones,
  ListChecks,
  Plus,
  Text,
  Trash2,
  Trophy,
  MessageCircle,
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
import { ChapterAssessmentActions } from "./chapter-assessment-actions";
import { ExperientialInterviewView } from "@/components/apprenant/experiential-interview-view";
import { X } from "lucide-react";
import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

type ArborescenceNodeStatus = "empty" | "complete";

function stripTagsLen(html?: string | null): number {
  if (!html) return 0;
  const plain = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length;
}

function arborescenceNodeStatus(opts: {
  content?: string;
  summary?: string;
  mediaUrl?: string;
  type: BuilderContentType;
  isQuiz?: boolean;
  quizId?: string | null;
  contentValidated?: boolean;
}): ArborescenceNodeStatus {
  if (opts.isQuiz) {
    return opts.quizId ? "complete" : "empty";
  }
  if ((opts as { isInterview?: boolean }).isInterview) {
    const ctx = String((opts as { interviewContext?: string }).interviewContext ?? "").trim();
    return ctx.length >= 80 ? "complete" : "empty";
  }
  const contentLen = stripTagsLen(opts.content);
  if (contentLen === 0) return "empty";
  return "complete";
}

function ArborescenceStatusDot({
  status,
  className,
}: {
  status: ArborescenceNodeStatus;
  className?: string;
}) {
  const color = status === "empty" ? "bg-red-500" : "bg-green-500";
  const title =
    status === "empty" ? "Aucun texte principal (après nettoyage HTML)" : "Texte principal présent";
  return (
    <span
      title={title}
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", color, className)}
      aria-hidden
    />
  );
}

export function CourseStructureBuilder({
  previewHref,
  courseId,
  theme = "dark",
}: {
  previewHref?: string;
  courseId?: string;
  theme?: "dark" | "light";
}) {
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

  const isLight = theme === "light";
  const primaryGradient =
    "bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] text-white font-bold hover:opacity-95";

  return (
    <Card
      id="course-builder-modules"
      className={
        isLight
          ? "border-0 bg-white text-slate-950 shadow-sm"
          : "border border-white/10 bg-[#0a0a0a] text-white shadow-none"
      }
    >
      <CardHeader
        className={
          isLight
            ? "flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between"
            : "flex flex-col gap-6 border-b border-white/10 xl:flex-row xl:items-center xl:justify-between"
        }
      >
        <div className="space-y-4">
          <div>
            <CardTitle className={isLight ? "text-[30px] font-extrabold leading-tight tracking-tight text-slate-950" : "text-[30px] font-semibold leading-tight text-white"}>
              Structure, chapitres & contenus
            </CardTitle>
            <p className={isLight ? "text-sm leading-relaxed text-slate-600" : "text-sm leading-relaxed text-white/60"}>
              Construisez une progression claire : chaque section introduit un chapitre, chaque chapitre peut se décliner en sous-chapitres pour rythmer l’apprentissage.
            </p>
          </div>
          {/* Actions rapides pour créer sections, chapitres, sous-chapitres */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={addSection}
              className={
                isLight
                  ? `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs ${primaryGradient}`
                  : "inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20"
              }
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
                  className={
                    isLight
                      ? `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs ${primaryGradient}`
                      : "inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20"
                  }
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
                  className={
                    isLight
                      ? `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs ${primaryGradient}`
                      : "inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-indigo-500/20 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30"
                  }
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
            className={
              isLight
                ? "rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                : "rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
            }
          >
            <Link href={previewLink}>Prévisualiser</Link>
          </Button>
          <Button
            onClick={addSection}
            className={isLight ? `rounded-full px-5 py-2 text-sm ${primaryGradient}` : "rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"}
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
                    <SectionCard
                      key={section.id}
                      section={section}
                      selection={selection}
                      isLight={isLight}
                      courseId={courseId}
                    />
                  ))
                ) : (
                  <div className={isLight ? "rounded-2xl bg-slate-50 px-6 py-10 text-center text-sm text-slate-600 shadow-sm" : "rounded-2xl border border-dashed border-white/10 bg-[#1a1a1a] px-6 py-10 text-center text-sm text-white/60"}>
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
        <DialogContent className={isLight ? "w-full max-w-[1400px] sm:max-w-[92vw] md:max-w-[90vw] xl:max-w-[1400px] border-0 bg-white p-0 shadow-2xl" : "w-full max-w-[1400px] sm:max-w-[92vw] md:max-w-[90vw] xl:max-w-[1400px] border border-white/10 bg-[#0a0a0a] p-0 shadow-2xl"}>
          <DialogHeader className={isLight ? "flex flex-row items-start justify-between gap-4 px-6 py-4" : "flex flex-row items-start justify-between gap-4 border-b border-white/10 px-6 py-4"}>
            <div>
              <DialogTitle className={isLight ? "text-base font-extrabold text-slate-950" : "text-base font-semibold text-white"}>
                {modalContext.title}
              </DialogTitle>
              {modalContext.subtitle ? (
                <DialogDescription className={isLight ? "text-sm text-slate-600" : "text-sm text-white/60"}>
                  {modalContext.subtitle}
                </DialogDescription>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseEditor}
              className={
                isLight
                  ? "h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  : "h-9 w-9 rounded-full border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              }
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="max-h-[calc(100vh-7rem)] min-h-[70vh] overflow-y-auto px-6 pb-6">
            <EditorPanel courseId={courseId} selectionOverride={expandedSelection} isLight={isLight} />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SectionCard({
  section,
  selection,
  isLight,
  courseId,
}: {
  section: CourseBuilderSection;
  selection: BuilderSelection;
  isLight: boolean;
  courseId?: string;
}) {
  const updateSection = useCourseBuilder((state) => state.updateSection);
  const removeSection = useCourseBuilder((state) => state.removeSection);
  const addChapter = useCourseBuilder((state) => state.addChapter);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      className={
        isLight
          ? "rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm transition"
          : "rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 text-white shadow-none transition"
      }
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className={
            isLight
              ? "mt-2 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900"
              : "mt-2 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:text-white"
          }
          aria-label="Réordonner la section"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 space-y-4">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className={cn(
              "flex w-full items-center gap-3 text-left text-xs font-medium",
              isLight ? "text-slate-600" : "text-white/60",
            )}
            aria-expanded={!isCollapsed}
          >
            <span
              className={
                isLight
                  ? "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-700"
                  : "inline-flex items-center rounded-full bg-blue-500/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.25em] text-blue-300"
              }
            >
              Section
            </span>
            <span className={cn("h-[1px] flex-1 rounded", isLight ? "bg-slate-200" : "bg-white/10")} />
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed ? "rotate-180" : "rotate-0",
              )}
            />
          </button>
          <Input
            value={section.title}
            onChange={(event) => updateSection(section.id, { title: event.target.value })}
            className={
              isLight
                ? "rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-950 placeholder:text-slate-400 shadow-sm"
                : "rounded-xl border border-white/10 bg-white/5 text-base font-medium text-white placeholder:text-white/30"
            }
            placeholder="Titre de la section"
          />
          {!isCollapsed ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => addChapter(section.id)}
                className={
                  isLight
                    ? "rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-5 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95"
                    : "rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Ajouter un chapitre
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => removeSection(section.id)}
                className={
                  isLight
                    ? "rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-red-600 hover:bg-slate-50"
                    : "rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5"
                }
              >
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer la section
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {!isCollapsed ? (
        <div className="mt-6 space-y-3">
        <SortableContext
          id={`chapter-context-${section.id}`}
          items={section.chapters.map((chapter) => chapter.id)}
          strategy={verticalListSortingStrategy}
        >
          <div ref={setChapterDropZoneRef} className="space-y-3">
            {section.chapters.length ? (
              section.chapters.map((chapter) => (
                <ChapterCard
                  key={chapter.id}
                  sectionId={section.id}
                  sectionTitle={section.title?.trim() || "Module"}
                  chapter={chapter}
                  selection={selection}
                  isLight={isLight}
                  courseId={courseId}
                />
              ))
            ) : (
              <p
                className={
                  isLight
                    ? "rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    : "rounded-2xl border border-dashed border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white/60"
                }
              >
                Ajoutez un chapitre pour démarrer la séquence de cette section.
              </p>
            )}
          </div>
        </SortableContext>
        </div>
      ) : null}
    </div>
  );
}

function ChapterCard({
  sectionId,
  sectionTitle,
  chapter,
  selection,
  isLight,
  courseId,
}: {
  sectionId: string;
  sectionTitle: string;
  chapter: CourseBuilderChapter;
  selection: BuilderSelection;
  isLight: boolean;
  courseId?: string;
}) {
  const primaryGradient =
    "bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] text-white font-bold hover:opacity-95";
  const removeChapter = useCourseBuilder((state) => state.removeChapter);
  const addSubchapter = useCourseBuilder((state) => state.addSubchapter);
  const selectChapter = useCourseBuilder((state) => state.selectChapter);
  const selectSubchapter = useCourseBuilder((state) => state.selectSubchapter);
  const removeSubchapter = useCourseBuilder((state) => state.removeSubchapter);
  const updateChapter = useCourseBuilder((state) => state.updateChapter);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        isLight
          ? "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition"
          : "rounded-2xl border border-white/10 border-l-4 border-l-white/10 bg-[#1a1a1a] p-5 transition",
        (isChapterSelected || isWithinSelection) &&
          (isLight ? "border-[#6633CC]/40 shadow-md" : "border-white/20 border-l-purple-400 bg-[#1f1f1f]"),
      )}
      onClick={() => selectChapter(sectionId, chapter.id)}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className={
            isLight
              ? "mt-1.5 rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-slate-900"
              : "mt-1.5 rounded-full border border-white/10 bg-white/5 p-1.5 text-white/60 transition hover:text-white"
          }
          aria-label="Réordonner le chapitre"
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              setIsCollapsed((prev) => !prev);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                setIsCollapsed((prev) => !prev);
              }
            }}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633CC]/25 focus-visible:ring-offset-2",
              isLight ? "text-slate-600" : "text-white/60",
            )}
            aria-expanded={!isCollapsed}
          >
            <span
              className={
                isLight
                  ? "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700"
                  : "inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-1 text-purple-300"
              }
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", isLight ? "bg-slate-500" : "bg-purple-300")} />
              Chapitre
            </span>
            <span className="flex-1" />
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                  className={cn(
                    "pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border transition",
                    isLight
                      ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                  aria-label="Paramètres du chapitre"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[420px] max-w-[92vw] bg-white text-slate-950">
                <SheetHeader className="px-6 pt-6">
                  <SheetTitle className="text-lg font-extrabold tracking-tight text-slate-950">
                    Paramètres du chapitre
                  </SheetTitle>
                  <SheetDescription className="text-slate-600">
                    Accès et conditions de déblocage.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 px-6 pb-8">
                  <div className="space-y-2">
                    <Label className="text-slate-950 font-bold">Dates d’accès</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Début</p>
                        <Input
                          type="date"
                          value={(chapter as any).access_start_date || ""}
                          onChange={(e) =>
                            updateChapter(sectionId, chapter.id, { access_start_date: e.target.value || null } as any)
                          }
                          className="rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Fin</p>
                        <Input
                          type="date"
                          value={(chapter as any).access_end_date || ""}
                          onChange={(e) =>
                            updateChapter(sectionId, chapter.id, { access_end_date: e.target.value || null } as any)
                          }
                          className="rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label className="text-slate-950 font-bold">Contenu validé</Label>
                        <p className="mt-1 text-xs text-slate-600">
                          La pastille verte du sommaire s’affiche dès qu’il y a du texte principal ; ce switch reste
                          disponible pour votre suivi interne.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(chapter.content_validated)}
                        onCheckedChange={(v) =>
                          updateChapter(sectionId, chapter.id, { content_validated: Boolean(v) })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-950 font-bold">Condition de déblocage</Label>
                    <Select
                      value={(chapter as any).unlock_condition || "previous_chapter_completed"}
                      onValueChange={(value) =>
                        updateChapter(sectionId, chapter.id, { unlock_condition: value } as any)
                      }
                    >
                      <SelectTrigger className="rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm">
                        <SelectValue placeholder="Choisir une condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="previous_chapter_completed">Fin du précédent</SelectItem>
                        <SelectItem value="previous_quiz_score">Score Quiz précédent</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Le contrôle réel d’accès sera appliqué côté lecture apprenant.
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isCollapsed ? "rotate-180" : "rotate-0")} />
          </div>
          <div
            className={cn(
              isLight
                ? "rounded-xl border border-slate-200 bg-white px-4 py-4 transition"
                : "rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-4 transition",
              (isChapterSelected || isWithinSelection) && (isLight ? "border-[#6633CC]/40" : "border-purple-400"),
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-1 items-start gap-3">
                <span
                  className={
                    isLight
                      ? "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-700"
                      : "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase text-white/70"
                  }
                >
                  C
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <ArborescenceStatusDot
                      status={arborescenceNodeStatus({
                        content: chapter.content,
                        summary: chapter.summary,
                        mediaUrl: chapter.mediaUrl,
                        type: chapter.type,
                        contentValidated: chapter.content_validated,
                      })}
                      className="mt-2.5"
                    />
                    <Input
                      value={chapter.title || ""}
                      onChange={(event) => updateChapter(sectionId, chapter.id, { title: event.target.value })}
                      onFocus={(event) => {
                        event.stopPropagation();
                        selectChapter(sectionId, chapter.id);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      placeholder="Titre du chapitre"
                      className={
                        isLight
                          ? "min-w-0 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-950 placeholder:text-slate-400 shadow-sm focus-visible:ring-[#6633CC]/20"
                          : "min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/30 focus-visible:ring-white/20"
                      }
                    />
                  </div>
                  <p className={isLight ? "text-sm leading-relaxed text-slate-600" : "text-sm leading-relaxed text-white/60"}>
                    {chapter.summary || "Décrivez la valeur de ce chapitre."}
                  </p>
                </div>
              </div>
              <div className={isLight ? "flex items-center gap-2 text-xs text-slate-600" : "flex items-center gap-2 text-xs text-white/60"}>
                <span className={isLight ? "rounded-md border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-700" : "rounded-md border border-white/10 bg-white/5 px-3 py-1 font-medium text-white/70"}>
                  {chapter.duration || "Durée ?"}
                </span>
                <span className={isLight ? "flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-700" : "flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1 font-medium text-white/60"}>
                  <typeMeta.icon className="h-3.5 w-3.5" />
                  {typeMeta.label}
                </span>
              </div>
            </div>
          </div>

          {!isCollapsed ? (
            <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleAddSubchapter();
              }}
              className={
                isLight
                  ? "rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-5 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95"
                  : "rounded-full bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-300"
              }
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
              className={
                isLight
                  ? "rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-red-600 hover:bg-slate-50"
                  : "rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5"
              }
            >
              <Trash2 className="mr-2 h-4 w-4" /> Retirer le chapitre
            </Button>
          </div>
          ) : null}
        </div>
      </div>

      {!isCollapsed ? (
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
                  isLight={isLight}
                  onSelect={() => selectSubchapter(sectionId, chapter.id, subchapter.id)}
                  onRemove={() => removeSubchapter(sectionId, chapter.id, subchapter.id)}
                />
              ))
            ) : (
              <p className={isLight ? "rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600" : "rounded-2xl border border-dashed border-white/10 bg-[#1a1a1a] px-4 py-3 text-xs text-white/60"}>
                Ajoutez un sous-chapitre pour détailler la progression (obligatoire si le chapitre comporte plusieurs temps forts).
              </p>
            )}
          </div>
        </SortableContext>
          <div
            className={cn(
              "mt-4 space-y-3 rounded-2xl border border-dashed px-4 py-4",
              isLight ? "border-violet-200 bg-violet-50/40" : "border-violet-400/25 bg-violet-950/20",
            )}
            onClick={(event) => event.stopPropagation()}
            role="presentation"
          >
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.22em]",
                isLight ? "text-violet-800" : "text-violet-200",
              )}
            >
              Fin de chapitre (après les sous-chapitres)
            </p>
            <ChapterAssessmentActions
              courseId={courseId}
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              chapter={chapter}
              isLight={isLight}
              primaryGradient={primaryGradient}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SubchapterRow({
  sectionId,
  chapterId,
  subchapter,
  selection,
  isLight,
  onSelect,
  onRemove,
}: {
  sectionId: string;
  chapterId: string;
  subchapter: CourseBuilderSubchapter;
  selection: BuilderSelection;
  isLight: boolean;
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
  const isQuizBlock = (subchapter as any).kind === "quiz" || Boolean((subchapter as any).quiz_id);
  const isInterviewBlock = (subchapter as any).kind === "experiential_interview";
  const subStatus = arborescenceNodeStatus({
    content: subchapter.content,
    summary: subchapter.summary,
    mediaUrl: subchapter.mediaUrl,
    type: subchapter.type,
    isQuiz: isQuizBlock,
    quizId: (subchapter as { quiz_id?: string }).quiz_id
      ? String((subchapter as { quiz_id?: string }).quiz_id)
      : null,
    isInterview: isInterviewBlock,
    interviewContext: (subchapter as { interview_context?: string }).interview_context,
    interviewObjectives: (subchapter as { interview_objectives?: string }).interview_objectives,
    contentValidated: subchapter.content_validated,
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isLight
          ? "flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm transition"
          : "flex items-start gap-3 rounded-2xl border border-white/10 bg-[#222222] px-4 py-3 text-sm text-white shadow-none transition",
        isSelected && (isLight ? "border-[#6633CC]/40 shadow-md" : "border-white/20 bg-[#262626]"),
        (isQuizBlock || isInterviewBlock) &&
          (isLight
            ? isInterviewBlock
              ? "border border-violet-300/80 bg-gradient-to-r from-violet-50 via-purple-50/90 to-violet-50 shadow-[inset_0_2px_10px_rgba(91,33,182,0.08)]"
              : "border border-slate-300/80 bg-gradient-to-r from-slate-100 via-indigo-100/80 to-slate-100 shadow-[inset_0_2px_10px_rgba(15,23,42,0.08)]"
            : isInterviewBlock
              ? "border border-violet-400/25 bg-gradient-to-r from-violet-950 via-purple-950 to-slate-900 shadow-[inset_0_2px_14px_rgba(91,33,182,0.35)]"
              : "border border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 shadow-[inset_0_2px_14px_rgba(0,0,0,0.45)]"),
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
        className={
          isLight
            ? "mt-1 rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition hover:text-slate-900"
            : "mt-1 rounded-full border border-white/10 bg-white/5 p-1 text-white/60 transition hover:text-white"
        }
        aria-label="Réordonner le sous-chapitre"
        onClick={(event) => event.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ArborescenceStatusDot status={subStatus} className="shrink-0" />
            {isQuizBlock ? (
              <Trophy
                className={cn(
                  "h-5 w-5 shrink-0 text-amber-300",
                  isLight
                    ? "drop-shadow-[0_0_6px_rgba(251,191,36,0.55)]"
                    : "drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]",
                )}
                aria-hidden
              />
            ) : isInterviewBlock ? (
              <MessageCircle
                className={cn(
                  "h-5 w-5 shrink-0 text-violet-400",
                  isLight ? "drop-shadow-[0_0_6px_rgba(139,92,246,0.45)]" : "drop-shadow-[0_0_10px_rgba(139,92,246,0.4)]",
                )}
                aria-hidden
              />
            ) : (
              <span
                className={
                  isLight
                    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-600"
                    : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-semibold uppercase text-white/60"
                }
              >
                {subchapter.title?.toLowerCase().startsWith("quiz") ? <ListChecks className="h-3.5 w-3.5" /> : "Sub"}
              </span>
            )}
            <Input
              value={subchapter.title || ""}
              onChange={(event) => updateSubchapter(sectionId, chapterId, subchapter.id, { title: event.target.value })}
              onFocus={(event) => {
                event.stopPropagation();
                onSelect();
              }}
              onClick={(event) => event.stopPropagation()}
              placeholder="Titre du sous-chapitre"
              className={
                isLight
                  ? "rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-950 placeholder:text-slate-400 shadow-sm focus-visible:ring-[#6633CC]/20"
                  : "rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white placeholder:text-white/30 focus-visible:ring-white/20"
              }
            />
          </div>
          <div className={isLight ? "flex items-center gap-2 text-xs text-slate-600" : "flex items-center gap-2 text-xs text-white/60"}>
            <span className={isLight ? "rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700" : "rounded-md border border-white/10 bg-white/10 px-2.5 py-1 font-medium text-white/70"}>
              {subchapter.duration || ""}
            </span>
            <span className={isLight ? "flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700" : "flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-medium text-white/60"}>
              <typeMeta.icon className="h-3 w-3" />
              {typeMeta.label}
            </span>
          </div>
        </div>
        <p className={isLight ? "text-xs leading-relaxed text-slate-600" : "text-xs leading-relaxed text-white/60"}>
          {subchapter.summary || "Définissez la promesse et les livrables."}
        </p>
      </div>
      {!isQuizBlock && !isInterviewBlock ? (
        <button
          type="button"
          title={subchapter.content_validated ? "Retirer la validation" : "Marquer le contenu comme validé (suivi interne)"}
          onClick={(event) => {
            event.stopPropagation();
            updateSubchapter(sectionId, chapterId, subchapter.id, {
              content_validated: !Boolean(subchapter.content_validated),
            });
          }}
          className={
            isLight
              ? cn(
                  "mt-1 rounded-full border p-1.5 transition",
                  subchapter.content_validated
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                )
              : cn(
                  "mt-1 rounded-full border p-1.5 transition",
                  subchapter.content_validated
                    ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 text-white/50 hover:bg-white/10 hover:text-white",
                )
          }
          aria-pressed={Boolean(subchapter.content_validated)}
          aria-label="Valider le contenu du sous-chapitre"
        >
          <CircleCheck className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className={
          isLight
            ? "mt-1 rounded-full border border-slate-200 bg-white p-1.5 text-red-600 transition hover:bg-slate-50"
            : "mt-1 rounded-full border border-white/10 p-1.5 text-red-400 transition hover:text-red-300 hover:bg-white/5"
        }
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
  isLight,
}: {
  courseId?: string;
  selectionOverride?: BuilderSelection | null;
  isLight: boolean;
}) {
  const sections = useCourseBuilder((state) => state.snapshot.sections);
  const tests = useCourseBuilder((state) => state.snapshot.tests);
  const formationTitle = useCourseBuilder((state) => state.snapshot.general.title);
  const storeSelection = useCourseBuilder((state) => state.selection);
  const updateChapter = useCourseBuilder((state) => state.updateChapter);
  const updateSubchapter = useCourseBuilder((state) => state.updateSubchapter);
  const addChapter = useCourseBuilder((state) => state.addChapter);
  const addSubchapter = useCourseBuilder((state) => state.addSubchapter);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showSubchapterModal, setShowSubchapterModal] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("none");
  const [isOpenAIAvailable, setIsOpenAIAvailable] = useState(true);
  const [openAIMessage, setOpenAIMessage] = useState<string | null>(null);
  const [isGeneratingFlashcards, startFlashcardsTransition] = useTransition();
  const selection = selectionOverride ?? storeSelection;

  const runGenerateFlashcards = (opts: { scopeId: string; content: string; title: string }) => {
    const { scopeId, content, title } = opts;
    if (!content || content.trim().length < 50) {
      toast.error("Le contenu doit contenir au moins 50 caractères pour générer des flashcards");
      return;
    }
    if (!courseId) {
      toast.error("CourseId manquant", { description: "Enregistrez ou ouvrez une formation avec un identifiant valide." });
      return;
    }

    startFlashcardsTransition(async () => {
      try {
        const response = await fetch("/api/ai/generate-flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterContent: content,
            chapterTitle: title || "Chapitre",
            chapterId: scopeId,
            courseId,
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

        const builderScopeId = (data.builderChapterKey as string | null | undefined) ?? scopeId;

        if (data.saved && data.savedCount > 0) {
          toast.success(`${data.flashcards.length} flashcard(s) générée(s) et sauvegardée(s)`, {
            description: `${data.savedCount} flashcard(s) ont été automatiquement ajoutées.`,
          });
          window.dispatchEvent(
            new CustomEvent("flashcards-created", {
              detail: {
                flashcards: data.flashcards,
                savedFlashcards: data.savedFlashcards || [],
                chapterId: data.chapterId,
                builderScopeId,
              },
            }),
          );
        } else {
          toast.success(`${data.flashcards.length} flashcard(s) générée(s)`, {
            description: "Les flashcards seront rattachées au bloc courant lors de l’enregistrement du cours.",
          });
          window.dispatchEvent(
            new CustomEvent("flashcards-created", {
              detail: {
                flashcards: data.flashcards,
                savedFlashcards: [],
                chapterId: null,
                builderScopeId,
              },
            }),
          );
        }
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
  };

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

  const primaryGradient =
    "bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] text-white font-bold hover:opacity-95";

  let content: ReactNode = (
    <div
      className={
        isLight
          ? "rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600"
          : "rounded-3xl border border-dashed border-white/10 bg-[#1a1a1a] p-6 text-center text-sm text-white/60"
      }
    >
      Sélectionnez un élément de la structure pour l'éditer.
    </div>
  );

  if (!selection || !nodes.chapter) {
    return <div className="flex h-full flex-col">{content}</div>;
  }

  if (selection.type === "chapter") {
    const meta = CONTENT_TYPE_MAP[nodes.chapter.type];
    const sectionTitle =
      sections.find((s) => s.id === selection.sectionId)?.title?.trim() || "Module";
    content = (
      <EditorLayout
        title="Éditeur de chapitre"
        badge={meta.label}
        isLight={isLight}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setShowChapterModal(true)}
            className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.25em]", primaryGradient)}
          >
            Créer le chapitre avec Beyond AI
          </Button>
          <ChapterAssessmentActions
            courseId={courseId}
            sectionId={selection.sectionId}
            sectionTitle={sectionTitle}
            chapter={nodes.chapter}
            isLight={isLight}
            primaryGradient={primaryGradient}
          />
          {tests.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                <SelectTrigger className="h-9 w-[260px] rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm">
                  <SelectValue placeholder="Insérer un quiz dans la structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choisir un quiz</SelectItem>
                  {tests.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title || t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                disabled={selectedQuizId === "none"}
                onClick={() => {
                  const quiz = tests.find((t) => t.id === selectedQuizId);
                  if (!quiz) return;
                  addSubchapter(selection.sectionId, selection.chapterId);
                  const snapshot = useCourseBuilder.getState().snapshot;
                  const section = snapshot.sections.find((s) => s.id === selection.sectionId);
                  const chapter = section?.chapters.find((c) => c.id === selection.chapterId);
                  const sub = chapter?.subchapters?.[chapter.subchapters.length - 1];
                  if (!sub?.id) return;
                  updateSubchapter(selection.sectionId, selection.chapterId, sub.id, {
                    title: quiz.title ? `Quiz · ${quiz.title}` : "Quiz",
                    type: "document",
                    content: quiz.url ? `<p><a href="${quiz.url}" target="_blank" rel="noreferrer">Ouvrir le quiz</a></p>` : "<p>Lien du quiz à définir.</p>",
                  });
                  setSelectedQuizId("none");
                  toast.success("Quiz inséré", { description: "Un bloc quiz a été ajouté à la fin du chapitre." });
                }}
                className={cn("h-9 rounded-full px-4 text-xs uppercase tracking-[0.25em]", primaryGradient)}
              >
                Insérer
              </Button>
            </div>
          ) : null}
          <Button
            type="button"
            onClick={() =>
              runGenerateFlashcards({
                scopeId: nodes.chapter!.id,
                content: nodes.chapter!.content ?? "",
                title: nodes.chapter!.title || "Chapitre",
              })
            }
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
          className={
            isLight
              ? "rounded-xl border border-slate-200 bg-white text-sm text-slate-950 placeholder:text-slate-400 shadow-sm"
              : "rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
          }
        />
        <div className="grid gap-3 md:grid-cols-[160px_1fr]">
          <Input
            value={nodes.chapter.duration}
            onChange={(event) => updateChapter(selection.sectionId, selection.chapterId, { duration: event.target.value })}
            placeholder="Durée / format"
            className={
              isLight
                ? "rounded-xl border border-slate-200 bg-white text-sm text-slate-950 placeholder:text-slate-400 shadow-sm"
                : "rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
            }
          />
          <ContentTypeSelect
            value={nodes.chapter.type}
            onChange={(value) => updateChapter(selection.sectionId, selection.chapterId, { type: value })}
          />
        </div>
        {/* Hybridation: média (optionnel) + texte (théorie) */}
        {(nodes.chapter.type === "video" || nodes.chapter.type === "audio") ? (
          <MediaUploader
            value={(nodes.chapter as any).mediaUrl ?? ""}
            onChange={(url) => updateChapter(selection.sectionId, selection.chapterId, { mediaUrl: url } as any)}
            mediaType={nodes.chapter.type}
          />
        ) : null}

        <RichTextEditor
          content={nodes.chapter.content ?? ""}
          onChange={(html) => updateChapter(selection.sectionId, selection.chapterId, { content: html })}
          placeholder="Insérez ici votre contenu théorique complet (script, explications, exemples, consignes...)."
        />

        {/* Gestionnaire de flashcards */}
        <FlashcardsManager courseId={courseId} chapterId={nodes.chapter?.id} scope="chapter" />
      </EditorLayout>
    );
  } else if (selection.type === "subchapter" && nodes.subchapter) {
    const meta = CONTENT_TYPE_MAP[nodes.subchapter.type];
    const isInterviewEditor = (nodes.subchapter as { kind?: string }).kind === "experiential_interview";
  const interviewCtx = String((nodes.subchapter as { interview_context?: string }).interview_context ?? "").trim();
  const interviewObjectives = String(
    (nodes.subchapter as { interview_objectives?: string }).interview_objectives ?? "",
  ).trim();

    if (isInterviewEditor) {
      content = (
        <EditorLayout title="Entretien expérientiel" badge="Conversation IA" isLight={isLight}>
          <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-600" : "text-white/65")}>
            L&apos;apprenant dialogue avec l&apos;assistant après le chapitre. Le contexte ci-dessous a été capturé à la
            création du bloc ; régénérez l&apos;entretien depuis l&apos;éditeur de chapitre si le contenu a beaucoup changé.
          </p>
          <Input
            value={nodes.subchapter.title}
            onChange={(event) =>
              updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
                title: event.target.value,
              })
            }
            placeholder="Titre affiché"
            className={
              isLight
                ? "rounded-xl border border-slate-200 bg-white text-sm text-slate-950 shadow-sm"
                : "rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            }
          />
          <Label className={cn("text-xs font-semibold uppercase tracking-[0.2em]", isLight ? "text-slate-600" : "text-white/60")}>
            Objectifs pédagogiques
          </Label>
          <Textarea
            value={interviewObjectives}
            onChange={(event) =>
              updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
                interview_objectives: event.target.value,
              } as Partial<CourseBuilderSubchapter>)
            }
            rows={5}
            className={
              isLight
                ? "rounded-xl border border-slate-200 bg-white text-sm text-slate-800"
                : "rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            }
            placeholder="Ce que l'entretien doit faire progresser chez l'apprenant…"
          />
          <Label className={cn("text-xs font-semibold uppercase tracking-[0.2em]", isLight ? "text-slate-600" : "text-white/60")}>
            Contexte chapitre (pour l&apos;IA)
          </Label>
          <Textarea
            value={interviewCtx}
            onChange={(event) =>
              updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
                interview_context: event.target.value,
              } as Partial<CourseBuilderSubchapter>)
            }
            rows={12}
            className={
              isLight
                ? "rounded-xl border border-violet-200 bg-violet-50/50 font-mono text-xs text-slate-800"
                : "rounded-xl border border-violet-500/30 bg-violet-950/30 font-mono text-xs text-violet-100"
            }
            placeholder="Contexte pédagogique pour l'IA…"
          />
          {interviewCtx.length >= 80 ? (
            <div className="space-y-2">
              <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", isLight ? "text-slate-500" : "text-white/50")}>
                Aperçu apprenant
              </p>
              <ExperientialInterviewView
                contextText={interviewCtx}
                interviewObjectives={interviewObjectives}
                chapterTitle={nodes.chapter?.title || nodes.subchapter.title || "Chapitre"}
                courseTitle={formationTitle}
              />
            </div>
          ) : (
            <p className={cn("text-sm", isLight ? "text-amber-700" : "text-amber-200")}>
              Ajoutez au moins 80 caractères de contexte pour tester l&apos;entretien.
            </p>
          )}
        </EditorLayout>
      );
    } else {
    content = (
      <EditorLayout
        title="Éditeur de sous-chapitre"
        badge={meta.label}
        isLight={isLight}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setShowSubchapterModal(true)}
            className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.25em]", primaryGradient)}
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() =>
              runGenerateFlashcards({
                scopeId: nodes.subchapter!.id,
                content: nodes.subchapter!.content ?? "",
                title: nodes.subchapter!.title || "Sous-chapitre",
              })
            }
            disabled={
              isGeneratingFlashcards ||
              !nodes.subchapter?.content ||
              nodes.subchapter.content.trim().length < 50 ||
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
        <Input
          value={nodes.subchapter.title}
          onChange={(event) =>
            updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
              title: event.target.value,
            })
          }
          placeholder="Titre du sous-chapitre"
          className={
            isLight
              ? "rounded-xl border border-slate-200 bg-white text-sm text-slate-950 placeholder:text-slate-400 shadow-sm"
              : "rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
          }
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
            className={
              isLight
                ? "rounded-xl border border-slate-200 bg-white text-sm text-slate-950 placeholder:text-slate-400 shadow-sm"
                : "rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
            }
          />
          <ContentTypeSelect
            value={nodes.subchapter.type}
            onChange={(value) =>
              updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, { type: value })
            }
          />
        </div>
        {(nodes.subchapter.type === "video" || nodes.subchapter.type === "audio") ? (
          <MediaUploader
            value={(nodes.subchapter as any).mediaUrl ?? ""}
            onChange={(url) =>
              updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, { mediaUrl: url } as any)
            }
            mediaType={nodes.subchapter.type}
          />
        ) : null}

        <RichTextEditor
          content={nodes.subchapter.content ?? ""}
          onChange={(html) =>
            updateSubchapter(selection.sectionId, selection.chapterId, selection.subchapterId, {
              content: html,
            })
          }
          placeholder="Contenu théorique complet + exemples + pas-à-pas."
        />

        {/* Gestionnaire de flashcards (clé = id du sous-chapitre sélectionné) */}
        <FlashcardsManager courseId={courseId} chapterId={nodes.subchapter.id} scope="subchapter" />
      </EditorLayout>
    );
    }
  }

  return <div className="flex h-full flex-col">{content}</div>;
}


function EditorLayout({
  title,
  badge,
  children,
  isLight,
}: {
  title: string;
  badge: string;
  children: ReactNode;
  isLight: boolean;
}) {
  return (
    <div
      className={
        isLight
          ? "space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900"
          : "space-y-4 rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 shadow-none"
      }
    >
      <header className="space-y-2">
        <p className={isLight ? "text-xs uppercase tracking-[0.35em] text-slate-600" : "text-xs uppercase tracking-[0.35em] text-white/60"}>
          {title}
        </p>
        <div
          className={
            isLight
              ? "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
              : "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1"
          }
        >
          <span className={isLight ? "h-2 w-2 rounded-full bg-slate-500" : "h-2 w-2 rounded-full bg-white/60"} />
          <span className={isLight ? "text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600" : "text-[10px] uppercase tracking-[0.3em] text-white/60"}>
            {badge}
          </span>
        </div>
      </header>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ContentTypeSelect({ value, onChange }: { value: BuilderContentType; onChange: (value: BuilderContentType) => void }) {
  const Selected = CONTENT_TYPE_MAP[value]?.icon;
  return (
    <Select value={value} onValueChange={(val) => onChange(val as BuilderContentType)}>
      <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-sm text-white">
        <SelectValue>
          <div className="flex items-center gap-2">
            {Selected ? <Selected className="h-4 w-4" /> : null}
            <span>{CONTENT_TYPE_MAP[value]?.label ?? "Type"}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border border-white/10 bg-[#1a1a1a] text-white">
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


