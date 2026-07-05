import {
  GLOBAL_SKILL_REFERENTIAL,
  referentialItemName,
  referentialItemSubtitle,
} from "@/lib/profile/competency-referential";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import type { SkillValidationSession } from "@/lib/hard-skills/skill-validation";

export type HardSkillProofLevel = "declared" | "justified" | "evaluated" | "certified";

export type HardSkillProof = {
  type: "link" | "document" | "portfolio" | "cv" | "other";
  url?: string;
  note?: string;
};

/** @deprecated Utiliser proofLevel */
export type HardSkillValidationStatus =
  | "auto-declared"
  | "edge-validated"
  | "certified"
  | "open-badge";

export type LearnerHardSkillRecord = {
  name: string;
  category: string;
  referentialCategory: string;
  level: HardSkillLevel;
  selfAssessment: number;
  proofLevel: HardSkillProofLevel;
  proof?: HardSkillProof;
  source: "catalog" | "manual" | "badge";
};

export type StoredHardSkillMeta = {
  level?: HardSkillLevel | "Débutant" | "Intermédiaire" | "Expert";
  selfAssessment?: number;
  category?: string;
  referentialCategory?: string;
  proofLevel?: HardSkillProofLevel;
  proof?: HardSkillProof;
  /** @deprecated */
  validationStatus?: HardSkillValidationStatus;
  validated?: boolean;
  source?: "catalog" | "manual" | "badge";
  validation?: SkillValidationSession;
};

export const HARD_SKILL_LEVELS: HardSkillLevel[] = ["Débutant", "Intermédiaire", "Confirmé", "Expert"];

export const DISPLAY_CATEGORIES = [
  "Vente",
  "IA",
  "Développement",
  "RH",
  "Marketing",
  "Management",
  "Finance",
  "Sport",
  "Communication",
  "CRM",
  "Bureautique",
] as const;

export type DisplayCategory = (typeof DISPLAY_CATEGORIES)[number];

const REFERENTIAL_TO_DISPLAY: Record<string, DisplayCategory> = {
  "Vente & Négociation": "Vente",
  "Business Development & Prospection": "Vente",
  "Management & Soft Skills": "Management",
  "Sport Business & Partenariats": "Sport",
  "Analyse comportementale & Intelligence": "Communication",
  "Marketing (Inbound, Growth & Content)": "Marketing",
  "Produit & Design": "Développement",
  "Développement Technique": "Développement",
  "Intelligence Artificielle": "IA",
};

const SKILL_NAME_OVERRIDES: Record<string, DisplayCategory> = {
  excel: "Bureautique",
  "power bi": "Finance",
  salesforce: "CRM",
  hubspot: "CRM",
  python: "Développement",
  figma: "Développement",
  photoshop: "Développement",
  "négociation complexe": "Vente",
  négociation: "Vente",
  recrutement: "RH",
};

export const PROOF_LEVEL_CHIP: Record<
  HardSkillProofLevel,
  { label: string; className: string; locked?: boolean }
> = {
  declared: {
    label: "Déclarée",
    className: "bg-white/8 text-white/55 border-white/15",
  },
  justified: {
    label: "Évaluation IA terminée",
    className: "bg-amber-500/20 text-amber-200 border-amber-400/35",
  },
  evaluated: {
    label: "Validée",
    className: "bg-emerald-500/20 text-emerald-200 border-emerald-400/35",
  },
  certified: {
    label: "Validée expert EDGE",
    className: "bg-violet-500/20 text-violet-200 border-violet-400/35",
  },
};

function resolveProofLevel(meta: StoredHardSkillMeta | undefined): HardSkillProofLevel {
  if (meta?.validation?.verdict === "validated") return "evaluated";
  if (meta?.validation?.status === "analyzed") {
    if (meta.validation.verdict === "pending" || meta.validation.verdict === "expert_needed") return "justified";
  }
  if (meta?.proofLevel) return meta.proofLevel;
  if (meta?.proof?.url || meta?.proof?.note) return "justified";
  if (meta?.validationStatus === "edge-validated" || meta?.validationStatus === "open-badge") return "justified";
  if (meta?.validationStatus === "certified") return "certified";
  return "declared";
}

export const LEVEL_CHIP_CLASS: Record<HardSkillLevel, string> = {
  Débutant: "bg-slate-500/20 text-slate-300 border-slate-400/30",
  Intermédiaire: "bg-sky-500/20 text-sky-200 border-sky-400/35",
  Confirmé: "bg-amber-500/20 text-amber-200 border-amber-400/35",
  Expert: "bg-emerald-500/20 text-emerald-200 border-emerald-400/35",
};

export const CATEGORY_CHIP_CLASS: Record<string, string> = {
  Vente: "bg-rose-500/15 text-rose-200 border-rose-400/25",
  IA: "bg-violet-500/15 text-violet-200 border-violet-400/25",
  Développement: "bg-indigo-500/15 text-indigo-200 border-indigo-400/25",
  RH: "bg-pink-500/15 text-pink-200 border-pink-400/25",
  Marketing: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/25",
  Management: "bg-orange-500/15 text-orange-200 border-orange-400/25",
  Finance: "bg-lime-500/15 text-lime-200 border-lime-400/25",
  Sport: "bg-teal-500/15 text-teal-200 border-teal-400/25",
  Communication: "bg-cyan-500/15 text-cyan-200 border-cyan-400/25",
  CRM: "bg-blue-500/15 text-blue-200 border-blue-400/25",
  Bureautique: "bg-zinc-500/15 text-zinc-200 border-zinc-400/25",
};

export function levelToSelfAssessment(level: HardSkillLevel): number {
  switch (level) {
    case "Expert":
      return 5;
    case "Confirmé":
      return 4;
    case "Intermédiaire":
      return 3;
    default:
      return 1;
  }
}

export function normalizeStoredLevel(raw: StoredHardSkillMeta["level"]): HardSkillLevel {
  if (raw === "Débutant" || raw === "Intermédiaire" || raw === "Confirmé" || raw === "Expert") {
    return raw;
  }
  return "Débutant";
}

export function findReferentialCategory(skillName: string): string {
  const norm = skillName.trim().toLowerCase();
  for (const group of GLOBAL_SKILL_REFERENTIAL) {
    for (const item of group.items) {
      if (referentialItemName(item).toLowerCase() === norm) {
        return group.category;
      }
    }
  }
  return "Autre";
}

export function resolveDisplayCategory(skillName: string, referentialCategory: string): string {
  const override = SKILL_NAME_OVERRIDES[skillName.trim().toLowerCase()];
  if (override) return override;
  return REFERENTIAL_TO_DISPLAY[referentialCategory] ?? referentialCategory.split(" ")[0] ?? "Autre";
}

export function buildHardSkillRecord(
  skillName: string,
  meta: StoredHardSkillMeta | undefined,
): LearnerHardSkillRecord {
  const referentialCategory = meta?.referentialCategory ?? findReferentialCategory(skillName);
  const level = normalizeStoredLevel(meta?.level);
  return {
    name: skillName,
    referentialCategory,
    category: meta?.category ?? resolveDisplayCategory(skillName, referentialCategory),
    level,
    selfAssessment: meta?.selfAssessment ?? levelToSelfAssessment(level),
    proofLevel: resolveProofLevel(meta),
    proof: meta?.proof,
    source: meta?.source ?? "catalog",
  };
}

export function parseHardSkillPortfolio(
  hardSkills: string[],
  metadata: Record<string, StoredHardSkillMeta>,
): LearnerHardSkillRecord[] {
  return hardSkills.map((name) => buildHardSkillRecord(name, metadata[name]));
}

export function buildStoredMeta(
  record: Omit<LearnerHardSkillRecord, "name">,
  validation?: SkillValidationSession,
): StoredHardSkillMeta {
  return {
    level: record.level,
    selfAssessment: record.selfAssessment,
    category: record.category,
    referentialCategory: record.referentialCategory,
    proofLevel: record.proofLevel,
    proof: record.proof,
    source: record.source,
    ...(validation ? { validation } : {}),
  };
}

export type HardSkillCatalogEntry = {
  name: string;
  subtitle?: string;
  category: string;
};

export function listCatalogEntries(): HardSkillCatalogEntry[] {
  return GLOBAL_SKILL_REFERENTIAL.flatMap((group) =>
    group.items.map((item) => ({
      name: referentialItemName(item),
      subtitle: referentialItemSubtitle(item),
      category: group.category,
    })),
  );
}

export function searchCatalogEntries(query: string): HardSkillCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return listCatalogEntries().filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.subtitle?.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q),
  );
}

export function computeHardSkillStats(records: LearnerHardSkillRecord[]) {
  const byLevel: Record<HardSkillLevel, number> = {
    Débutant: 0,
    Intermédiaire: 0,
    Confirmé: 0,
    Expert: 0,
  };
  for (const r of records) {
    byLevel[r.level] += 1;
  }
  return {
    total: records.length,
    byLevel,
  };
}

export function masteryBarFilled(level: HardSkillLevel): number {
  return levelToSelfAssessment(level);
}
