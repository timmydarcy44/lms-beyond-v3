import type { TrainingCoursePublic } from "@/lib/training-courses/types";
import { recognitionTypeLabel } from "@/lib/training-courses/qualiopi-fiche";

export type PublicRecognition = {
  /** Texte unique pour le bloc « Type de reconnaissance ». */
  text: string;
  /** La fiche délivre un Open Badge (carte Tarifs / bloc badge). */
  hasOpenBadge: boolean;
  /** Libellé court pour la carte Tarifs (null si pas d’Open Badge). */
  badgeLabel: string | null;
};

function stripLeadingLabel(detail: string, label: string): string {
  const d = detail.trim();
  const l = label.trim();
  if (!d || !l) return d;
  if (d.toLowerCase().startsWith(l.toLowerCase())) {
    return d.slice(l.length).replace(/^[\s—\-–:,.]+/, "").trim();
  }
  return d;
}

/**
 * Source unique reconnaissance publique (bloc Informations + carte Tarifs).
 * Évite la duplication « Attestation… — Attestation… ».
 */
export function buildPublicRecognition(
  course: Pick<
    TrainingCoursePublic,
    "recognition_type" | "recognition_detail" | "badge_name" | "badge_class_id"
  >,
  opts?: { badgeMetaName?: string | null },
): PublicRecognition {
  const type = String(course.recognition_type ?? "").trim();
  const label = recognitionTypeLabel(type) || "";
  const rawDetail = String(course.recognition_detail ?? "").trim();
  const hasOpenBadge =
    type === "open_badge" ||
    Boolean(course.badge_class_id) ||
    Boolean(String(course.badge_name ?? "").trim()) ||
    Boolean(String(opts?.badgeMetaName ?? "").trim()) ||
    /\bopen\s*badge\b/i.test(rawDetail);

  const badgeLabel = hasOpenBadge
    ? String(opts?.badgeMetaName ?? course.badge_name ?? "").trim() || "Open Badge Byound"
    : null;

  if (type === "attestation_fin" || label.toLowerCase().includes("attestation")) {
    let text = rawDetail;
    if (!text) {
      text = `${label || "Attestation de fin de formation"} délivrée après validation du quiz final.`;
    } else if (label && text.toLowerCase().startsWith(label.toLowerCase())) {
      // Le détail contient déjà le libellé → une seule fois.
      text = text;
    } else {
      const rest = stripLeadingLabel(text, label);
      text = rest ? `${label} ${rest}` : label || text;
      if (!/[.!?]$/.test(text)) text = `${text}.`;
    }
    if (hasOpenBadge && !/\bopen\s*badge\b/i.test(text)) {
      text = `${text.replace(/[.!?]\s*$/, "")}, et Open Badge Byound.`;
    }
    return { text: text.trim(), hasOpenBadge, badgeLabel };
  }

  if (rawDetail) {
    // Détail déjà complet (souvent Open Badge + attestation) → pas de préfixe doublon.
    if (label && rawDetail.toLowerCase().startsWith(label.toLowerCase())) {
      return { text: rawDetail, hasOpenBadge, badgeLabel };
    }
    if (label && !rawDetail.toLowerCase().includes(label.toLowerCase().slice(0, 12))) {
      return { text: `${label} — ${rawDetail}`, hasOpenBadge, badgeLabel };
    }
    return { text: rawDetail, hasOpenBadge, badgeLabel };
  }

  if (label) {
    let text = label;
    if (hasOpenBadge && type !== "open_badge") {
      text = `${label}, et Open Badge Byound.`;
    }
    return { text, hasOpenBadge, badgeLabel };
  }

  return {
    text: hasOpenBadge ? "Open Badge Byound" : "À rédiger",
    hasOpenBadge,
    badgeLabel,
  };
}
