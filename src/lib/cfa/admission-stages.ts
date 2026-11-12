import type { CfaApplicationStatus } from "@/lib/cfa-applications";

export type AdmissionStageId =
  | "brochure"
  | "candidature"
  | "interview"
  | "review"
  | "administrative"
  | "admitted";

export type AdmissionStage = {
  id: AdmissionStageId;
  label: string;
  color: string;
  dbStatuses: CfaApplicationStatus[];
};

/** Mapping affichage — les valeurs DB ne changent pas. */
export const ADMISSION_STAGES: AdmissionStage[] = [
  {
    id: "brochure",
    label: "Fiche cursus",
    color: "#9AA3BD",
    dbStatuses: ["brochure"],
  },
  {
    id: "candidature",
    label: "Candidature",
    color: "#8DB8FF",
    dbStatuses: ["profile", "challenge", "dossier"],
  },
  {
    id: "interview",
    label: "Entretien",
    color: "#C9C2FF",
    dbStatuses: ["interview"],
  },
  {
    id: "review",
    label: "À relire",
    color: "#F2CF6B",
    dbStatuses: ["review"],
  },
  {
    id: "administrative",
    label: "Dossier administratif",
    color: "#FFB86B",
    dbStatuses: ["administrative"],
  },
  {
    id: "admitted",
    label: "Admis",
    color: "#6BE39B",
    dbStatuses: ["admitted", "contract"],
  },
];

export const ADMISSION_REJECTED_LABEL = "Non retenu";
export const ADMISSION_BLOCKED_DAYS = 30;

const BY_STATUS = new Map<CfaApplicationStatus, AdmissionStageId>();
for (const stage of ADMISSION_STAGES) {
  for (const status of stage.dbStatuses) BY_STATUS.set(status, stage.id);
}

export function admissionStageFromStatus(status: string | null | undefined): AdmissionStageId | null {
  if (status === "rejected") return null;
  return BY_STATUS.get(String(status ?? "") as CfaApplicationStatus) ?? null;
}

export function admissionStageMeta(stageId: AdmissionStageId): AdmissionStage {
  return ADMISSION_STAGES.find((s) => s.id === stageId)!;
}

export function admissionStatusLabel(status: string | null | undefined): string {
  if (status === "rejected") return ADMISSION_REJECTED_LABEL;
  const stage = admissionStageFromStatus(status);
  return stage ? admissionStageMeta(stage).label : String(status ?? "");
}

export function admissionStatusColor(status: string | null | undefined): string {
  if (status === "rejected") return "#6C7593";
  const stage = admissionStageFromStatus(status);
  return stage ? admissionStageMeta(stage).color : "#6C7593";
}

export function stageProgressIndex(status: string | null | undefined): number {
  const stage = admissionStageFromStatus(status);
  if (!stage) return -1;
  return ADMISSION_STAGES.findIndex((s) => s.id === stage);
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
