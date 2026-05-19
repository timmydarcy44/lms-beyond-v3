/** IDs UUID dans le sommaire (chapitres / sous-chapitres). */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidLike(value: unknown): boolean {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

export type OutlineSection = {
  id: string;
  title: string;
  chapters: Array<{
    id: string;
    title: string;
    subchapters: Array<{ id: string; title: string }>;
  }>;
};

export function collectProgressLeafIds(sections: OutlineSection[]): string[] {
  const ids: string[] = [];
  for (const s of sections) {
    for (const ch of s.chapters ?? []) {
      const chId = String(ch?.id ?? "").trim();
      if (isUuidLike(chId)) ids.push(chId);
      for (const sub of ch.subchapters ?? []) {
        const sid = String(sub?.id ?? "").trim();
        if (isUuidLike(sid)) ids.push(sid);
      }
    }
  }
  return [...new Set(ids)];
}

export type LearnerOutlineProgress = {
  state: "none" | "percent" | "completed";
  percent: number | null;
};

/** Progression affichée sur une carte (chapitre / sous-chapitre). */
export type ItemLearnerProgress = LearnerOutlineProgress;

const SESSION_REF_SECONDS = 600;

/**
 * Déduit l’état d’une carte à partir des sessions serveur (temps actif max par contenu).
 * Pas de session → aucun badge. Session courte → %. Au-delà du seuil → terminé.
 */
export function progressFromSessionAggregate(params: {
  hasSession: boolean;
  maxActiveSeconds: number;
}): ItemLearnerProgress {
  if (!params.hasSession) return { state: "none", percent: null };
  const act = Math.max(0, params.maxActiveSeconds);
  if (act >= SESSION_REF_SECONDS) return { state: "completed", percent: 100 };
  if (act === 0) return { state: "percent", percent: 5 };
  const pct = Math.min(95, Math.max(8, Math.round((act / SESSION_REF_SECONDS) * 100)));
  return { state: "percent", percent: pct };
}

/** Synthèse chapitre : sous-chapitres d’abord ; si aucun sous-chapitre commencé, repli sur l’ID chapitre. */
export function mergeChapterProgress(
  subProgress: ItemLearnerProgress[],
  chapterOwn: ItemLearnerProgress,
): ItemLearnerProgress {
  if (subProgress.length > 0) {
    const allDone = subProgress.every((p) => p.state === "completed");
    if (allDone) return { state: "completed", percent: 100 };
    const anySubStarted = subProgress.some((p) => p.state !== "none");
    if (anySubStarted) {
      const sum = subProgress.reduce((acc, p) => {
        if (p.state === "completed") return acc + 100;
        if (p.state === "percent") return acc + (p.percent ?? 0);
        return acc;
      }, 0);
      return { state: "percent", percent: Math.round(sum / subProgress.length) };
    }
    return chapterOwn;
  }
  return chapterOwn;
}

/**
 * Combine `enrollments.progress` (si présent) et `learning_sessions` sur le cours / leçons.
 */
export function computeOutlineLearnerProgress(params: {
  enrollmentProgress: number | null | undefined;
  sessionContentIds: Set<string>;
  courseId: string;
  leafIds: string[];
}): LearnerOutlineProgress {
  const { enrollmentProgress, sessionContentIds, courseId, leafIds } = params;
  const totalLeaves = Math.max(1, leafIds.length);
  const ep =
    typeof enrollmentProgress === "number" && Number.isFinite(enrollmentProgress)
      ? Math.max(0, Math.min(100, enrollmentProgress))
      : null;

  if (ep != null && ep >= 98) {
    return { state: "completed", percent: 100 };
  }

  if (ep != null && ep > 0) {
    return { state: "percent", percent: Math.round(ep) };
  }

  const visitedLeaves = leafIds.filter((id) => sessionContentIds.has(id)).length;
  const openedCourse = sessionContentIds.has(courseId);

  if (visitedLeaves > 0) {
    if (leafIds.length > 0 && visitedLeaves >= leafIds.length) {
      return { state: "completed", percent: 100 };
    }
    const pct = Math.min(97, Math.max(1, Math.round((visitedLeaves / totalLeaves) * 100)));
    return { state: "percent", percent: pct };
  }

  if (openedCourse) {
    return { state: "percent", percent: Math.min(12, Math.max(2, Math.ceil(100 / totalLeaves))) };
  }

  return { state: "none", percent: null };
}
