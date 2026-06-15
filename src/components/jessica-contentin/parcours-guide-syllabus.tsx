"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronRight, ClipboardList, FileText, Layers, MessageCircle, X } from "lucide-react";
import { JessicaRemoteImage } from "@/components/jessica-contentin/jessica-remote-image";
import type { ParcoursGuideSection, ParcoursGuideSyllabusItem } from "@/lib/jessica-contentin/parcours-guide-catalog";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGES = ["/jessica-contentin/parcours-tdah/section-04.jpg"] as const;

function itemIcon(type: ParcoursGuideSyllabusItem["type"]) {
  if (type === "resource") return FileText;
  if (type === "entretien") return MessageCircle;
  return ClipboardList;
}

function itemStyle(type: ParcoursGuideSyllabusItem["type"]) {
  if (type === "resource") return "text-[#8B6914] bg-[#FAF3E8] border-[#E6D9C6]";
  if (type === "entretien") return "text-[#5C5348] bg-[#F0EBF5] border-[#E0D4EC]";
  return "text-[#5C5348] bg-white border-[#E6D9C6]/60";
}

function sectionDisplayTitle(title: string) {
  return title.replace(/^Section\s+\d+\s*—\s*/i, "");
}

function sectionStats(section: ParcoursGuideSection) {
  const chapters = section.chapters.length;
  let subchapters = 0;
  let resources = 0;
  let entretiens = 0;
  for (const ch of section.chapters) {
    for (const item of ch.items) {
      if (item.type === "resource") resources++;
      else if (item.type === "entretien") entretiens++;
      else subchapters++;
    }
  }
  return { chapters, subchapters, resources, entretiens };
}

function SectionContent({ section }: { section: ParcoursGuideSection }) {
  return (
    <div className="divide-y divide-[#F0E8DC]">
      {section.chapters.map((chapter) => (
        <div key={chapter.title} className="px-6 py-5 md:px-8">
          <h4 className="text-sm font-semibold text-[#2F2A25] md:text-[15px]">{chapter.title}</h4>
          <ul className="mt-4 space-y-2.5">
            {chapter.items.map((item) => {
              const Icon = itemIcon(item.type);
              return (
                <li
                  key={item.label}
                  className={cn(
                    "flex gap-3 rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed",
                    itemStyle(item.type),
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function StatPill({ icon: Icon, label }: { icon: typeof BookOpen; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
      <Icon className="h-3 w-3 opacity-90" strokeWidth={2} />
      {label}
    </span>
  );
}

type Props = {
  sections: ParcoursGuideSection[];
};

export function ParcoursGuideSyllabus({ sections }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openSection = openIndex != null ? sections[openIndex] : null;

  const close = useCallback(() => setOpenIndex(null), []);

  useEffect(() => {
    if (openIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [openIndex, close]);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        {sections.map((section, index) => {
          const stats = sectionStats(section);
          const imageUrl = section.imageUrl ?? FALLBACK_IMAGES[0];

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative aspect-[4/5] min-h-[300px] overflow-hidden rounded-[28px] text-left shadow-[0_20px_60px_-20px_rgba(47,42,37,0.45)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_32px_70px_-18px_rgba(47,42,37,0.5)] sm:min-h-[340px]"
            >
              <JessicaRemoteImage
                src={imageUrl}
                alt=""
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.06]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/95 via-[#2F2A25]/45 to-[#2F2A25]/10" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#C6A664]/10 via-transparent to-transparent opacity-80" />

              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
                <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/15 px-3 text-sm font-bold text-white backdrop-blur-md">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-md">
                  Section
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <h3 className="text-xl font-semibold leading-snug tracking-tight text-white md:text-[1.35rem]">
                  {sectionDisplayTitle(section.title)}
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatPill
                    icon={BookOpen}
                    label={`${stats.chapters} chapitre${stats.chapters > 1 ? "s" : ""}`}
                  />
                  <StatPill
                    icon={Layers}
                    label={`${stats.subchapters} sous-chapitre${stats.subchapters > 1 ? "s" : ""}`}
                  />
                  {stats.resources > 0 ? (
                    <StatPill
                      icon={FileText}
                      label={`${stats.resources} ressource${stats.resources > 1 ? "s" : ""}`}
                    />
                  ) : null}
                  {stats.entretiens > 0 ? (
                    <StatPill
                      icon={MessageCircle}
                      label={`${stats.entretiens} entretien${stats.entretiens > 1 ? "s" : ""}`}
                    />
                  ) : null}
                </div>

                <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 transition group-hover:gap-2.5">
                  Explorer
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {openSection && openIndex != null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="syllabus-overlay-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#2F2A25]/65 backdrop-blur-md"
              aria-label="Fermer"
              onClick={close}
            />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex max-h-[min(92vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-[#FAF7F2] shadow-2xl sm:rounded-[28px]"
            >
              <div className="relative h-36 shrink-0 overflow-hidden sm:h-44">
                <JessicaRemoteImage
                  src={openSection.imageUrl ?? FALLBACK_IMAGES[0]}
                  alt=""
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-[#2F2A25]/50 to-[#2F2A25]/30" />
                <button
                  type="button"
                  onClick={close}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
                  aria-label="Fermer le détail"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute inset-x-0 bottom-0 px-6 pb-4 md:px-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8B6914]">
                    Section {String(openIndex + 1).padStart(2, "0")}
                  </span>
                  <h3
                    id="syllabus-overlay-title"
                    className="mt-1 text-xl font-semibold leading-snug text-[#2F2A25]"
                  >
                    {sectionDisplayTitle(openSection.title)}
                  </h3>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-white">
                <SectionContent section={openSection} />
              </div>

              <div className="shrink-0 border-t border-[#E6D9C6]/60 bg-white px-6 py-4 md:px-8">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={openIndex <= 0}
                    onClick={() => setOpenIndex((i) => (i != null && i > 0 ? i - 1 : i))}
                    className="text-sm font-medium text-[#8B6914] disabled:opacity-30"
                  >
                    ← Précédent
                  </button>
                  <span className="text-xs text-[#9A7B52]">
                    {openIndex + 1} / {sections.length}
                  </span>
                  <button
                    type="button"
                    disabled={openIndex >= sections.length - 1}
                    onClick={() =>
                      setOpenIndex((i) => (i != null && i < sections.length - 1 ? i + 1 : i))
                    }
                    className="text-sm font-medium text-[#8B6914] disabled:opacity-30"
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
