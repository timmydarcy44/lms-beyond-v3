"use client";

import { useEffect, useState } from "react";
import { FileText, PenLine, Sparkles } from "lucide-react";

type CourseHit = { id: string; title: string; moduleCount: number; published: boolean; duration?: string | number | null };

export function BadgeBuilderStart({
  onBlank,
  onDescribe,
  onCourse,
  describing,
  courseTitle,
  demand,
  onDemand,
  waitLabel,
  error,
  onRetry,
}: {
  onBlank: () => void;
  onDescribe: (text: string, file: File | null, badgeId: string) => void;
  onCourse: (courseId: string) => void;
  describing: boolean;
  courseTitle?: string | null;
  demand: "decouverte" | "maitrise" | "expertise";
  onDemand: (value: "decouverte" | "maitrise" | "expertise") => void;
  waitLabel?: string | null;
  error?: string | null;
  onRetry?: () => void;
}) {
  const [mode, setMode] = useState<"course" | "description" | "blank">("course");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<CourseHit[]>([]);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [badgeId, setBadgeId] = useState("");
  const [badges, setBadges] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch(`/api/super-admin/open-badges/generate-from-course?q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((payload: { courses?: CourseHit[] }) => setCourses(Array.isArray(payload.courses) ? payload.courses : []))
        .catch(() => setCourses([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    void fetch("/api/admin/badgeclasses")
      .then((response) => response.json())
      .then((payload: { badgeClasses?: Array<{ id?: string; name?: string }> }) => {
        const rows = Array.isArray(payload.badgeClasses) ? payload.badgeClasses : [];
        setBadges(rows.flatMap((item) => item.id && item.name ? [{ id: item.id, name: item.name }] : []));
      })
      .catch(() => setBadges([]));
  }, []);

  const cards = [
    { id: "course" as const, title: "À partir d'une formation", phrase: "L'IA lit la formation et prépare le badge.", icon: FileText },
    { id: "description" as const, title: "À partir d'une description", phrase: "Un texte, un PDF ou un badge existant.", icon: Sparkles },
    { id: "blank" as const, title: "Partir de zéro", phrase: "Formulaire vide.", icon: PenLine },
  ];

  if (describing) {
    return (
      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-8">
        <p className="text-lg font-semibold">✦ Préparation du badge</p>
        <p className="mt-4 text-sm text-[#EEF0F7]">{waitLabel || "Lecture des sections…"}</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="text-lg font-semibold">Comment voulez-vous créer ce badge ?</h2>
        {courseTitle ? <p className="mt-2 text-sm text-[#3DDCAB]">Badge préparé à partir de « {courseTitle} ».</p> : null}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            const selected = mode === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setMode(card.id);
                  if (card.id === "blank") onBlank();
                }}
                className={`rounded-3xl border p-4 text-left ${selected ? "border-[#6E5BFF] bg-[#241C4A]" : "border-[#1A2340] bg-[#0B1122]"}`}
              >
                <Icon className="mb-3 h-5 w-5 text-[#B9B2FF]" />
                <p className="font-medium">{card.title}</p>
                <p className="mt-1 text-sm text-[#8C94B2]">{card.phrase}</p>
              </button>
            );
          })}
        </div>
      </section>

      {mode !== "blank" ? (
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <p className="mb-2 text-sm text-[#A9B0CC]">Niveau d&apos;exigence</p>
          <div className="flex flex-wrap gap-2">
            {([
              ["decouverte", "Découverte"],
              ["maitrise", "Maîtrise"],
              ["expertise", "Expertise"],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => onDemand(id)} className={`rounded-full px-4 py-2 text-sm ${demand === id ? "bg-[#6E5BFF] text-white" : "border border-[#26304F]"}`}>{label}</button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[#8C94B2]">Même moule pour chaque thématique : un verbe observable, un attendu que l&apos;expert peut vérifier, une étude de cas et un questionnaire en complément.</p>
        </section>
      ) : null}

      {mode === "course" ? (
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une formation" className="mb-3 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm" />
          <ul className="space-y-2">
            {courses.map((course) => (
              <li key={course.id}>
                <button type="button" onClick={() => setSelectedCourse(course.id)} className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm ${selectedCourse === course.id ? "border-[#6E5BFF] bg-[#241C4A]" : "border-[#1A2340]"}`}>
                  <span>{course.title}</span>
                  <span className="text-xs text-[#8C94B2]">{course.moduleCount} module{course.moduleCount > 1 ? "s" : ""}{course.duration ? ` · ${course.duration}` : ""} · {course.published ? "publié" : "brouillon"}</span>
                </button>
              </li>
            ))}
          </ul>
          {error ? (
            <div className="mt-4 rounded-2xl border border-[#F2C15A]/40 bg-[#F2C15A]/10 p-3 text-sm text-[#F2C15A]">
              <p>{error}</p>
              {onRetry ? <button type="button" className="mt-2 underline" onClick={onRetry}>Réessayer</button> : null}
            </div>
          ) : null}
          <button type="button" disabled={!selectedCourse} onClick={() => selectedCourse && onCourse(selectedCourse)} className="bb-white mt-4 rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-40">
            ✦ Préparer le badge avec l&apos;IA
          </button>
        </section>
      ) : null}

      {mode === "description" ? (
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} placeholder="Décrivez la thématique, par exemple la gestion de projet ou l'accueil en magasin" className="w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm" />
          {error ? (
            <div className="mt-4 rounded-2xl border border-[#F2C15A]/40 bg-[#F2C15A]/10 p-3 text-sm text-[#F2C15A]">
              <p>{error}</p>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-full border border-[#26304F] px-4 py-2 text-sm">
              {file ? file.name : "Importer un PDF"}
              <input type="file" accept="application/pdf" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </label>
            <select value={badgeId} onChange={(event) => setBadgeId(event.target.value)} className="rounded-full border border-[#26304F] bg-[#0B1122] px-4 py-2 text-sm">
              <option value="">Ou un badge existant</option>
              {badges.map((badge) => <option key={badge.id} value={badge.id}>{badge.name}</option>)}
            </select>
            <button type="button" disabled={!prompt.trim() && !file && !badgeId} onClick={() => onDescribe(prompt, file, badgeId)} className="bb-white rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-40">
              ✦ Préparer le badge avec l&apos;IA
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
