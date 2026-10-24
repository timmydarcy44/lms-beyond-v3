import type { CourseBuilderSnapshot } from "@/types/course-builder";

export type FicheCheck = {
  id: string;
  label: string;
  ok: boolean;
  step?: number;
  /** Absent ou true : compte dans le score de publication. */
  required?: boolean;
};

function minutesOf(value: string | undefined) {
  const match = String(value ?? "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function ficheChecks(snapshot: CourseBuilderSnapshot): FicheCheck[] {
  const general = snapshot.general;
  const sections = (snapshot.sections ?? []).filter((section) => !section.deleted_at);
  const contents = sections.flatMap((section) =>
    (section.chapters ?? [])
      .filter((chapter) => !chapter.deleted_at)
      .flatMap((chapter) => {
        const subs = (chapter.subchapters ?? []).filter((sub) => !sub.deleted_at);
        return subs.length ? subs : [chapter];
      }),
  );
  const ready = (item: { content?: string; duration?: string; type?: string; kind?: string; quiz_id?: string; resource_id?: string }) => {
    const filled = Boolean(item.kind || item.quiz_id || item.resource_id || String(item.content ?? "").trim());
    if (!filled) return false;
    if (item.type === "video" || item.type === "text") return minutesOf(item.duration) > 0;
    return true;
  };
  const total = contents.reduce((sum, item) => sum + minutesOf(item.duration), 0);

  return [
    {
      id: "identity",
      label: "Titre, présentation et format",
      ok: Boolean(general.title?.trim() && general.presentation?.trim() && general.delivery_format?.trim()),
      step: 1,
    },
    {
      id: "objectives",
      label: "Au moins 2 objectifs pédagogiques",
      ok: (general.objectifs ?? []).filter((item) => item.trim()).length >= 2,
      step: 2,
    },
    {
      id: "audience",
      label: "Public visé et prérequis",
      ok: (general.audiences ?? []).length > 0 && (general.prerequisites ?? []).some((item) => item.trim()),
      step: 2,
    },
    {
      id: "quiz",
      label: "Au moins un quiz par chapitre",
      ok: false,
      required: false,
    },
    {
      id: "duration",
      label: "Durée totale supérieure à 0",
      ok: total > 0,
      step: 3,
    },
    {
      id: "ready",
      label: "Tous les contenus au statut Prêt",
      ok: contents.length > 0 && contents.every(ready),
    },
    {
      id: "evaluation",
      label: "Modalités d'évaluation",
      ok: Boolean(general.evaluation_modalities?.trim()),
      step: 3,
    },
    {
      id: "cover",
      label: "Image de couverture et texte alternatif",
      ok: Boolean(general.cover_image?.trim() && general.cover_alt?.trim()),
      step: 4,
    },
  ];
}

export function ficheScore(snapshot: CourseBuilderSnapshot) {
  const checks = ficheChecks(snapshot);
  const required = checks.filter((item) => item.required !== false);
  return { checks, done: required.filter((item) => item.ok).length, total: required.length };
}
