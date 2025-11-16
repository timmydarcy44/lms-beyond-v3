"use client";

import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { CourseBuilderSnapshot } from "@/types/course-builder";

type CourseLearnerPreviewProps = {
  snapshot?: CourseBuilderSnapshot;
};

export function CourseLearnerPreview({ snapshot }: CourseLearnerPreviewProps) {
  const storeSnapshot = useCourseBuilder((state) => state.snapshot);

  const data = snapshot ?? storeSnapshot;
  const general = data.general;
  const sections = data.sections;
  const objectives = data.objectives;
  const skills = data.skills;

  const firstSection = sections[0];
  const firstChapter = firstSection?.chapters[0];
  const firstSub = firstChapter?.subchapters[0];

  const heroTitle = firstSub?.title ?? firstChapter?.title ?? general.title ?? "Prévisualisation";
  const heroModule = firstSection?.title ?? "Module à définir";
  const heroDuration = firstSub?.duration ?? firstChapter?.duration ?? general.duration ?? "-";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-[#18181b] via-[#101012] to-[#040404] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.55)]">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">{heroTitle}</h2>
            <p className="text-sm text-white/60">
              Module : {heroModule} • {heroDuration}
            </p>
          </div>

          {/* Afficher le contenu formaté du chapitre/sous-chapitre */}
          {(firstSub?.content || firstChapter?.content) ? (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-gradient-to-br from-[#1f2933] via-[#10151c] to-[#05080c] p-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Contenu du chapitre</h3>
                <div 
                  className="prose prose-invert prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-em:text-white/90 prose-a:text-blue-400 prose-a:underline prose-ul:text-white/90 prose-ol:text-white/90 prose-li:text-white/90 prose-img:rounded-lg prose-img:max-w-full max-w-none text-white/85 leading-relaxed [&_div]:[overflow:visible] [&_*]:[max-width:100%] [&_img]:[max-width:100%] [&_img]:[height:auto]"
                  style={{
                    isolation: 'isolate',
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: firstSub?.content || firstChapter?.content || ""
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[32px] border border-white/10 bg-black/40 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Objectifs pédagogiques</p>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {objectives.length ? (
                  objectives.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#FF512F]" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-white/40">Ajoutez les objectifs pour vos apprenants.</li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Compétences développées</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.length ? (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/60"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/40">Ajoutez les compétences associées.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="rounded-[32px] border border-white/10 bg-black/35 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Sommaire</p>
        </div>

        <div className="mt-6 space-y-5">
          {sections.map((section, sectionIndex) => {
            const sectionDuration = section.chapters.reduce((acc, chapter) => {
              const duration = Number(chapter.duration?.replace(/[^0-9]/g, ""));
              return acc + (Number.isFinite(duration) ? duration : 0);
            }, 0);
            const displayDuration = sectionDuration > 0 ? `${sectionDuration} min` : "";

            return (
              <div key={section.id ?? sectionIndex} className="space-y-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-white/40">
                  <span>{section.title || `Section ${sectionIndex + 1}`}</span>
                  <span>{displayDuration}</span>
                </div>
                <div className="space-y-2">
                  {section.chapters.map((chapter, chapterIndex) => (
                    <div
                      key={chapter.id ?? chapterIndex}
                      className={cn(
                        "rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-white/70 transition",
                        sectionIndex === 0 && chapterIndex === 0 &&
                          "border-transparent bg-gradient-to-r from-[#FF512F] via-[#F76B1C] to-[#DD2476] text-white shadow-[0_18px_45px_rgba(255,81,47,0.35)]",
                      )}
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em]">
                        <span>{chapter.title || `Chapitre ${chapterIndex + 1}`}</span>
                        <span>{chapter.duration || "-"}</span>
                      </div>
                      <p className="mt-2 text-xs text-white/70">
                        {chapter.summary || "Ajoutez un résumé inspirant pour vos apprenants."}
                      </p>
                      {chapter.subchapters.length ? (
                        <ul className="mt-3 space-y-1 text-[11px] text-white/60">
                          {chapter.subchapters.map((sub) => (
                            <li key={sub.id} className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/30 px-3 py-2">
                              <span>{sub.title}</span>
                              <span className="text-white/40">{sub.duration || ""}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

