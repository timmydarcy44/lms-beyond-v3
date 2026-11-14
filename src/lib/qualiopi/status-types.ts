export type QualiopiUiStatus = "proven" | "todo" | "missing" | "na";

export type QualiopiProofRef = {
  label: string;
  href: string | null;
  updatedAt: string | null;
  counter: string | null;
};

export type QualiopiIndicatorStatus = {
  indicatorId: number;
  criterionId: number;
  shortTitle: string;
  scopeTag?: "CFA" | "Certifiant" | "PFST" | "VAE";
  status: QualiopiUiStatus;
  proofs: QualiopiProofRef[];
  nextAction: { label: string; href: string } | null;
  naJustification: string | null;
  helpWhere: string | null;
  helpHow: string | null;
};

export type QualiopiStatusSnapshot = {
  generatedAt: string;
  activities: Record<string, boolean>;
  audit: {
    type: "initial" | "surveillance" | "renouvellement";
    at: string | null;
    daysUntil: number | null;
  };
  coffre: { deposited: number; expected: number };
  emargements: { complete: number; total: number };
  veilles: { toReadThisMonth: number };
  indicators: QualiopiIndicatorStatus[];
  summary: {
    proven: number;
    todo: number;
    missing: number;
    na: number;
    applicable: number;
    total: number;
  };
};
