import type { CfaApplicationStatus } from "@/lib/cfa-applications";

/**
 * Étapes affichées (page publique, liste Admissions, fiche candidat).
 * Les valeurs DB restent inchangées ; le regroupement est purement UI.
 *
 * Mapping ancien → nouveau :
 * - brochure, profile → Profil
 * - challenge, dossier → Challenge et parcours
 * - interview sans entretien planifié → Envoyée
 * - interview avec entretien planifié → Entretien
 * - review → Décision
 * - admitted → Admis
 * - administrative → Dossier administratif
 * - contract → En contrat
 */
export type AdmissionStageId =
  | "profile"
  | "challenge"
  | "submitted"
  | "interview"
  | "decision"
  | "admitted"
  | "administrative"
  | "contract";

export type AdmissionStage = {
  id: AdmissionStageId;
  label: string;
  color: string;
  /** Statuts DB couverts (pour filtres larges). Affinage via interview_at. */
  dbStatuses: CfaApplicationStatus[];
};

export const ADMISSION_STAGES: AdmissionStage[] = [
  {
    id: "profile",
    label: "Profil",
    color: "#9AA3BD",
    dbStatuses: ["brochure", "profile"],
  },
  {
    id: "challenge",
    label: "Challenge et parcours",
    color: "#8DB8FF",
    dbStatuses: ["challenge", "dossier"],
  },
  {
    id: "submitted",
    label: "Envoyée",
    color: "#5EDCC3",
    dbStatuses: ["interview"],
  },
  {
    id: "interview",
    label: "Entretien",
    color: "#C9C2FF",
    dbStatuses: ["interview"],
  },
  {
    id: "decision",
    label: "Décision",
    color: "#F2CF6B",
    dbStatuses: ["review"],
  },
  {
    id: "admitted",
    label: "Admis",
    color: "#6BE39B",
    dbStatuses: ["admitted"],
  },
  {
    id: "administrative",
    label: "Dossier administratif",
    color: "#FFB86B",
    dbStatuses: ["administrative"],
  },
  {
    id: "contract",
    label: "En contrat",
    color: "#6BE3C0",
    dbStatuses: ["contract"],
  },
];

/** Frise principale (sélection) — sans la suite admin. */
export const ADMISSION_SELECTION_STAGES = ADMISSION_STAGES.filter((s) =>
  ["profile", "challenge", "submitted", "interview", "decision", "admitted"].includes(s.id),
);

export const ADMISSION_REJECTED_LABEL = "Non retenu";
export const ADMISSION_BLOCKED_DAYS = 30;

export type AdmissionStageContext = {
  status: string | null | undefined;
  interviewAt?: string | null;
  interviewRealizedAt?: string | null;
};

export function admissionStageFromApplication(ctx: AdmissionStageContext): AdmissionStageId | null {
  const status = String(ctx.status ?? "");
  if (status === "rejected") return null;
  if (status === "brochure" || status === "profile") return "profile";
  if (status === "challenge" || status === "dossier") return "challenge";
  if (status === "interview") {
    return ctx.interviewAt ? "interview" : "submitted";
  }
  if (status === "review") {
    // Décision uniquement si entretien réalisé ; sinon on reste sur Entretien.
    if (ctx.interviewRealizedAt) return "decision";
    return "interview";
  }
  if (status === "admitted") return "admitted";
  if (status === "administrative") return "administrative";
  if (status === "contract") return "contract";
  return null;
}

/** @deprecated Préférer admissionStageFromApplication avec le contexte entretien. */
export function admissionStageFromStatus(status: string | null | undefined): AdmissionStageId | null {
  return admissionStageFromApplication({ status });
}

export function admissionStageMeta(stageId: AdmissionStageId): AdmissionStage {
  return ADMISSION_STAGES.find((s) => s.id === stageId)!;
}

export function admissionStatusLabel(
  status: string | null | undefined,
  ctx?: Omit<AdmissionStageContext, "status">,
): string {
  if (status === "rejected") return ADMISSION_REJECTED_LABEL;
  const stage = admissionStageFromApplication({ status, ...ctx });
  return stage ? admissionStageMeta(stage).label : String(status ?? "");
}

export function admissionStatusColor(
  status: string | null | undefined,
  ctx?: Omit<AdmissionStageContext, "status">,
): string {
  if (status === "rejected") return "#6C7593";
  const stage = admissionStageFromApplication({ status, ...ctx });
  return stage ? admissionStageMeta(stage).color : "#6C7593";
}

export function stageProgressIndex(
  status: string | null | undefined,
  ctx?: Omit<AdmissionStageContext, "status">,
): number {
  const stage = admissionStageFromApplication({ status, ...ctx });
  if (!stage) return -1;
  return ADMISSION_STAGES.findIndex((s) => s.id === stage);
}

/** Statut DB cible quand on clique une étape affichée. */
export function dbStatusForStage(
  stageId: AdmissionStageId,
  current?: { interviewAt?: string | null; interviewRealizedAt?: string | null },
): CfaApplicationStatus {
  switch (stageId) {
    case "profile":
      return "profile";
    case "challenge":
      return "challenge";
    case "submitted":
      return "interview";
    case "interview":
      return "interview";
    case "decision":
      return "review";
    case "admitted":
      return "admitted";
    case "administrative":
      return "administrative";
    case "contract":
      return "contract";
    default:
      return "challenge";
  }
}

export function canMoveToDecision(ctx: {
  interviewRealizedAt?: string | null;
}): boolean {
  return Boolean(ctx.interviewRealizedAt);
}

const DOC_LABELS: Record<string, string> = {
  identity: "pièce d'identité",
  social_security: "RIB",
  diploma: "diplôme",
};

export const REQUIRED_ADMIN_DOCS = ["identity", "social_security", "diploma"] as const;

export function missingAdminDocs(
  docs: Record<string, string> | null | undefined,
): string[] {
  const present = docs ?? {};
  return REQUIRED_ADMIN_DOCS.filter((key) => !present[key]).map((key) => DOC_LABELS[key] || key);
}

export function daysInCurrentStatus(updatedAt: string | null | undefined, from = new Date()) {
  if (!updatedAt) return null;
  const t = Date.parse(updatedAt);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((from.getTime() - t) / (24 * 60 * 60 * 1000)));
}
