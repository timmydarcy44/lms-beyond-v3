import { normalizeThematicKey } from "@/lib/galaxy-thematic-helpers";
import { isExactEdgeLabLabel, tryMatchEdgeLabCategoryName } from "@/lib/edge-lab-course-categories";
import {
  isExactPlaymakersLabel,
  tryMatchPlaymakersCategoryName,
} from "@/lib/playmakers-course-categories";
import type { LearnerCard } from "@/lib/queries/apprenant";

const AUTRES = "Autres";

/**
 * EDGE Lab : uniquement thématiques business. Les libellés « sport » (Playmakers) vont en « Autres ».
 */
export function resolveEdgeLabLearnerThematicSectionTitle(
  course: LearnerCard,
  officialOrder: string[] | null | undefined,
): string {
  const raw = String(course.category_name ?? "").trim() || String(course.category ?? "").trim();
  if (!raw) return AUTRES;

  if (tryMatchPlaymakersCategoryName(raw) || isExactPlaymakersLabel(raw)) {
    return AUTRES;
  }

  const order = (officialOrder ?? []).map((n) => String(n).trim()).filter(Boolean);
  if (order.length === 0) {
    return raw;
  }

  const direct = order.find((n) => normalizeThematicKey(n) === normalizeThematicKey(raw));
  if (direct) return direct;

  const canon = tryMatchEdgeLabCategoryName(raw) ?? (isExactEdgeLabLabel(raw) ? raw : null);
  if (canon) {
    const row = order.find((n) => normalizeThematicKey(n) === normalizeThematicKey(canon));
    if (row) return row;
  }

  return AUTRES;
}

/**
 * Playmakers : uniquement thématiques sport (liste canonique). Un libellé EDGE en base part en « Autres ».
 */
export function resolvePlaymakersLearnerThematicSectionTitle(
  course: LearnerCard,
  officialOrder: string[] | null | undefined,
): string {
  const raw = String(course.category_name ?? "").trim() || String(course.category ?? "").trim();
  if (!raw) return AUTRES;

  if (tryMatchEdgeLabCategoryName(raw) || isExactEdgeLabLabel(raw)) {
    return AUTRES;
  }

  const order = (officialOrder ?? []).map((n) => String(n).trim()).filter(Boolean);
  if (order.length === 0) {
    return raw;
  }

  const direct = order.find((n) => normalizeThematicKey(n) === normalizeThematicKey(raw));
  if (direct) return direct;

  const canon = tryMatchPlaymakersCategoryName(raw) ?? (isExactPlaymakersLabel(raw) ? raw : null);
  if (canon) {
    const row = order.find((n) => normalizeThematicKey(n) === normalizeThematicKey(canon));
    if (row) return row;
  }

  return AUTRES;
}