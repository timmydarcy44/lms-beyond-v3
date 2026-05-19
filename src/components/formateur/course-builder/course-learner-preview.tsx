"use client";

import { CheckCircle2, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { CourseBuilderSnapshot } from "@/types/course-builder";
import { useEffect, useMemo, useState } from "react";
import { ExperientialInterviewView } from "@/components/apprenant/experiential-interview-view";
import { extractChapterPlainText } from "@/lib/course-builder/chapter-content-text";

type CourseLearnerPreviewProps = {
  snapshot?: CourseBuilderSnapshot;
};

type PreviewNode = {
  key: string;
  label: string;
  title: string;
  html: string;
  mediaUrl?: string;
  sectionTitle: string;
  chapterTitle: string;
  kind: "content" | "quiz" | "interview";
  interviewContext?: string;
};

export function CourseLearnerPreview({ snapshot }: CourseLearnerPreviewProps) {
  const storeSnapshot = useCourseBuilder((state) => state.snapshot);

  const data = snapshot ?? storeSnapshot;
  const general = data.general;
  const sections = data.sections;
  const [activeView, setActiveView] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const nodes = useMemo(() => {
    const out: PreviewNode[] = [];
    sections.forEach((section, sIdx) => {
      section.chapters.forEach((chapter, cIdx) => {
        const chapterPlain = extractChapterPlainText(chapter);
        if (chapter.subchapters?.length) {
          chapter.subchapters.forEach((sub, subIdx) => {
            const html = String(sub.content ?? "").trim();
            const mediaUrl = (sub as { mediaUrl?: string }).mediaUrl
              ? String((sub as { mediaUrl?: string }).mediaUrl)
              : undefined;
            const subKind = String((sub as { kind?: string }).kind ?? "");
            const isQuiz =
              subKind === "quiz" ||
              (sub.title || "").toLowerCase().startsWith("quiz") ||
              html.toLowerCase().includes("ouvrir le quiz");
            const isInterview = subKind === "experiential_interview";
            const interviewContext = String((sub as { interview_context?: string }).interview_context ?? "").trim();
            out.push({
              key: `s${sIdx}-c${cIdx}-sub${subIdx}`,
              label: sub.title || `Sous-chapitre ${subIdx + 1}`,
              title: sub.title || chapter.title || `Sous-chapitre ${subIdx + 1}`,
              html,
              mediaUrl,
              sectionTitle: section.title || `Section ${sIdx + 1}`,
              chapterTitle: chapter.title || `Chapitre ${cIdx + 1}`,
              kind: isQuiz ? "quiz" : isInterview ? "interview" : "content",
              interviewContext:
                interviewContext || (isInterview ? chapterPlain.slice(0, 14_000) : undefined),
            });
          });
        } else {
          const html = String(chapter.content ?? "").trim();
          const mediaUrl = (chapter as { mediaUrl?: string }).mediaUrl
            ? String((chapter as { mediaUrl?: string }).mediaUrl)
            : undefined;
          const isQuiz =
            (chapter.title || "").toLowerCase().startsWith("quiz") || html.toLowerCase().includes("ouvrir le quiz");
          out.push({
            key: `s${sIdx}-c${cIdx}`,
            label: chapter.title || `Chapitre ${cIdx + 1}`,
            title: chapter.title || `Chapitre ${cIdx + 1}`,
            html,
            mediaUrl,
            sectionTitle: section.title || `Section ${sIdx + 1}`,
            chapterTitle: chapter.title || `Chapitre ${cIdx + 1}`,
            kind: isQuiz ? "quiz" : "content",
          });
        }
      });
    });
    return out;
  }, [sections]);

  useEffect(() => {
    setActiveView((prev) => Math.min(prev, Math.max(0, nodes.length - 1)));
  }, [nodes.length]);

  const active = nodes[activeView] ?? null;
  const canGoPrev = activeView > 0;
  const canGoNext = activeView < nodes.length - 1;

  return (
    <div className="grid h-[calc(100vh-140px)] gap-6 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-500">Mode LMS</p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-950">
                {general.title || "Prévisualisation"}
              </h2>
              <p className="truncate text-sm text-slate-600">{general.subtitle || ""}</p>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {nodes.length ? `${activeView + 1}/${nodes.length}` : "0/0"}
            </div>
          </div>
          {general.linear_progression ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-amber-700">
                Progression linéaire activée
              </p>
              <p className="mt-1 text-sm text-amber-900/90">
                Les apprenants devront suivre les étapes dans l’ordre. Les contenus suivants se débloquent au fur et à mesure.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex-1 overflow-hidden p-8">
            {!active ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">
                Ajoutez au moins un chapitre/sous-chapitre pour prévisualiser.
              </div>
            ) : active.kind === "quiz" ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-500">{active.sectionTitle}</p>
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-950">C’est l’heure du test !</h3>
                <p className="max-w-xl text-sm text-slate-600">{active.title}</p>
                <p className="text-sm text-slate-600">Lancez le quiz, puis revenez ici pour continuer.</p>
              </div>
            ) : active.kind === "interview" ? (
              <ExperientialInterviewView
                contextText={active.interviewContext || ""}
                chapterTitle={active.chapterTitle}
                courseTitle={general.title}
                className="h-full min-h-[min(72vh,640px)]"
              />
            ) : (
              <div className="flex h-full flex-col overflow-hidden">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-500">{active.sectionTitle}</p>
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-950">{active.title}</h3>
                  <p className="text-xs text-slate-500">{active.chapterTitle}</p>
                </div>

                {active.mediaUrl ? (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Média</p>
                    <p className="mt-2 truncate text-sm text-slate-700">{active.mediaUrl}</p>
                  </div>
                ) : null}

                <div className="mt-6 flex-1 overflow-y-auto pr-2">
                  {active.html ? (
                    <div
                      className="prose prose-slate max-w-none prose-headings:text-slate-950 prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-[#6633CC] prose-a:underline prose-li:text-slate-700 [&_*]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: active.html }}
                    />
                  ) : (
                    <p className="text-sm text-slate-600">Contenu à compléter.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={!canGoPrev}
                onClick={() => setActiveView((v) => Math.max(0, v - 1))}
                className="rounded-full bg-slate-100 px-5 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                ← Précédent
              </Button>
              <Button
                type="button"
                disabled={!active}
                onClick={() => {
                  if (!active) return;
                  setCompleted((prev) => ({ ...prev, [active.key]: true }));
                  if (canGoNext) setActiveView((v) => v + 1);
                }}
                className="rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-6 font-extrabold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
              >
                Terminer la leçon
              </Button>
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden h-full overflow-hidden lg:block">
        <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-500">Sommaire</p>
            <p className="text-xs font-semibold text-slate-500">
              {Object.keys(completed).length}/{nodes.length}
            </p>
          </div>
          <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
            {nodes.map((node, idx) => {
              const isActive = idx === activeView;
              const isDone = Boolean(completed[node.key]);
              return (
                <button
                  key={`toc-${node.key}`}
                  type="button"
                  onClick={() => setActiveView(idx)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition",
                    isActive
                      ? "border-[#6633CC]/40 bg-[#6633CC]/5 text-slate-950"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <span className="line-clamp-2">{node.label}</span>
                  <span className="flex items-center gap-2">
                    {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
                    <ChevronRight className="mt-0.5 h-4 w-4 text-slate-400" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
