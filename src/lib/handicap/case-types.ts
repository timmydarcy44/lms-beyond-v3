export const PIPELINE_STEPS = [
  { id: "request", label: "Demande" },
  { id: "interview", label: "Entretien" },
  { id: "plan", label: "Plan" },
  { id: "active", label: "Mise en œuvre" },
  { id: "review", label: "Bilan" },
] as const;

export type PipelineStepId = (typeof PIPELINE_STEPS)[number]["id"];

export function statusToStepIndex(status: string): number {
  const map: Record<string, number> = {
    request: 0,
    interview: 1,
    plan: 2,
    active: 3,
    review: 4,
    closed: 4,
  };
  return map[status] ?? 0;
}

const CATEGORY_LABEL: Record<string, string> = {
  evaluations: "Évaluations",
  supports: "Supports",
  rythme: "Rythme",
  locaux: "Locaux",
  materiel: "Matériel",
  autre: "Autre",
};

export function accommodationCategoryLabel(category: string) {
  return CATEGORY_LABEL[category] ?? category;
}

export const ACTION_STATUS_LABEL: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Fait",
  planned: "Planifié",
};

export type DisabilityCaseDetail = {
  id: string;
  status: string;
  statusLabel: string;
  scope: string;
  personName: string;
  personFirstName: string;
  roleLine: string;
  organizationName: string | null;
  consentGivenAt: string | null;
  consentMethod: string | null;
  rqthValidUntil: string | null;
  companyInformed: boolean;
  nextFormation: string | null;
  stepIndex: number;
  accommodations: Array<{
    id: string;
    category: string;
    label: string;
    details: string | null;
    sharedWithTrainerAt: string | null;
  }>;
  actions: Array<{
    id: string;
    label: string;
    owner: string;
    dueDate: string | null;
    status: string;
    doneAt: string | null;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    scheduledAt: string | null;
    mode: string | null;
    notes: string;
    status: string;
    closedAt: string | null;
  }>;
  documents: Array<{
    id: string;
    kind: string;
    title: string;
    uploadedAt: string;
    validUntil: string | null;
  }>;
  partners: Array<{
    id: string;
    partner: string;
    status: string | null;
    note: string | null;
  }>;
  accessLog: Array<{
    id: string;
    action: string;
    actorId: string | null;
    createdAt: string;
  }>;
};
