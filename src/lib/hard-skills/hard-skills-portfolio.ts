import {
  canonicalSkillName,
  catalogCategoryFor,
  listPublicCatalogEntries,
  searchPublicCatalog,
  type CatalogSkillEntry,
} from "@/lib/hard-skills/skill-catalog-policy";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import type { SkillValidationSession } from "@/lib/hard-skills/skill-validation";

export type HardSkillProofLevel = "declared" | "justified" | "evaluated" | "certified";

export type HardSkillProof = {
  type: "link" | "document" | "portfolio" | "cv" | "other";
  url?: string;
  note?: string;
};

export type SkillProofItem = {
  id: string;
  type: HardSkillProof["type"];
  title: string;
  url?: string;
  note?: string;
  fileName?: string;
  createdAt: string;
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
  /** Preuves déposées. `proof` reste la dernière, pour les lecteurs anciens. */
  proofs?: SkillProofItem[];
  /** Copie des fiches fusionnées. Rien n'est effacé du dossier d'origine. */
  legacySnapshots?: Record<string, StoredHardSkillMeta>;
  /** @deprecated */
  validationStatus?: HardSkillValidationStatus;
  validated?: boolean;
  source?: "catalog" | "manual" | "badge";
  validation?: SkillValidationSession;
  /** Objectif d'entraînement (Byound Skills Training Center). */
  trainingTargetLevel?: HardSkillLevel;
  trainingStartedAt?: string;
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
    className: "bg-sky-500/15 text-sky-100 border-sky-400/30",
  },
  justified: {
    label: "Preuve déposée",
    className: "bg-amber-500/20 text-amber-100 border-amber-400/35",
  },
  evaluated: {
    label: "Validée Byound",
    className: "bg-emerald-500/20 text-emerald-100 border-emerald-400/35",
  },
  certified: {
    label: "Validée Byound",
    className: "bg-emerald-500/20 text-emerald-100 border-emerald-400/35",
  },
};

/** Statuts UX distincts — niveau ≠ statut. */
export type SkillUxStatus = "auto_declared" | "evaluated" | "proved" | "validated";

export const SKILL_UX_STATUS: Record<
  SkillUxStatus,
  { label: string; className: string }
> = {
  auto_declared: {
    label: "Déclarée",
    className: "bg-sky-500/15 text-sky-100 border-sky-400/30",
  },
  evaluated: {
    label: "Évaluée",
    className: "bg-violet-500/20 text-violet-100 border-violet-400/35",
  },
  proved: {
    label: "Preuve déposée",
    className: "bg-amber-500/20 text-amber-100 border-amber-400/35",
  },
  validated: {
    label: "Validée Byound",
    className: "bg-emerald-500/20 text-emerald-100 border-emerald-400/35",
  },
};

/**
 * Mapping rétrocompatible :
 * - manuelle / catalog sans preuve → Auto-déclarée
 * - preuve / analyse pending → Preuve déposée
 * - analyse IA terminée (non validée) → Évaluée
 * - verdict validated / certified → Validée Byound
 * Ne rétrograde jamais une compétence déjà prouvée ou validée.
 */
export function resolveSkillUxStatus(meta: StoredHardSkillMeta | undefined): SkillUxStatus {
  const proofLevel = resolveProofLevel(meta);
  if (
    proofLevel === "certified" ||
    meta?.validation?.expertValidated ||
    meta?.validation?.verdict === "validated" ||
    proofLevel === "evaluated"
  ) {
    return "validated";
  }
  if (meta?.validation?.status === "analyzed") {
    return "evaluated";
  }
  if (proofLevel === "justified" || meta?.proof?.url || meta?.proof?.note) {
    return "proved";
  }
  return "auto_declared";
}

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
  return catalogCategoryFor(skillName) ?? "Autre";
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
  aliases?: string[];
};

export function listCatalogEntries(): HardSkillCatalogEntry[] {
  return listPublicCatalogEntries().map(toCatalogEntry);
}

export function searchCatalogEntries(query: string, extras: CatalogSkillEntry[] = []): HardSkillCatalogEntry[] {
  return searchPublicCatalog(query, extras).map(toCatalogEntry);
}

function toCatalogEntry(entry: CatalogSkillEntry): HardSkillCatalogEntry {
  return { name: entry.name, subtitle: entry.subtitle, category: entry.category, aliases: entry.aliases };
}

export function listSkillProofs(meta: StoredHardSkillMeta | undefined): SkillProofItem[] {
  if (!meta) return [];
  if (meta.proofs?.length) return meta.proofs;
  if (!meta.proof?.url && !meta.proof?.note) return [];
  const note = meta.proof.note ?? "";
  const fileName = note.match(/Fichier\s*:\s*([^·]+)/)?.[1]?.trim();
  return [
    {
      id: "legacy",
      type: meta.proof.type,
      title: fileName || note.split("·")[0]?.trim() || "Preuve",
      url: meta.proof.url,
      note: note || undefined,
      fileName,
      createdAt: meta.validation?.analyzedAt ?? "",
    },
  ];
}

export type SkillDeclarationStatus = {
  key: "declared" | "proof" | "badge";
  label: string;
  proofCount: number;
};

/** Seule source des statuts affichés : Déclarée, Preuve déposée, Badge obtenu. */
export function getSkillDeclarationStatus(
  meta: StoredHardSkillMeta | undefined,
  options?: { badgeEarned?: boolean },
): SkillDeclarationStatus {
  const proofCount = listSkillProofs(meta).length;
  if (options?.badgeEarned) {
    return { key: "badge", label: "Badge obtenu", proofCount };
  }
  if (proofCount <= 0) return { key: "declared", label: "Déclarée", proofCount: 0 };
  if (proofCount === 1) return { key: "proof", label: "Preuve déposée", proofCount };
  return { key: "proof", label: `${proofCount} preuves déposées`, proofCount };
}

const LEVEL_RANK: Record<string, number> = {
  Débutant: 1,
  Intermédiaire: 2,
  Confirmé: 3,
  Expert: 4,
};

function higherLevel(a: HardSkillLevel | undefined, b: HardSkillLevel | undefined): HardSkillLevel {
  const left = a && LEVEL_RANK[a] ? a : "Débutant";
  const right = b && LEVEL_RANK[b] ? b : "Débutant";
  return (LEVEL_RANK[left] ?? 1) >= (LEVEL_RANK[right] ?? 1) ? left : right;
}

function snapshotOf(meta: StoredHardSkillMeta): StoredHardSkillMeta {
  const { legacySnapshots: _ignored, ...rest } = meta;
  return rest;
}

/** Regroupe les alias vers le nom canonique. Les preuves et l'ancien contenu restent dans legacySnapshots. */
export function mergeDeclaredPortfolio(
  names: string[],
  meta: Record<string, StoredHardSkillMeta>,
): { names: string[]; meta: Record<string, StoredHardSkillMeta>; changed: boolean; before: number; after: number; proofsBefore: number; proofsAfter: number } {
  const rawNames = names.map((name) => name.trim()).filter(Boolean);
  const canonicalDeclared = new Set(rawNames.map((name) => canonicalSkillName(name)));
  const sourceNames = [
    ...new Set([
      ...rawNames,
      ...Object.keys(meta).filter((key) => canonicalDeclared.has(canonicalSkillName(key))),
    ]),
  ];
  const proofsBefore = sourceNames.reduce((sum, name) => sum + listSkillProofs(meta[name]).length, 0);
  const groups = new Map<string, string[]>();
  for (const name of sourceNames) {
    const canon = canonicalSkillName(name);
    const bucket = groups.get(canon) ?? [];
    bucket.push(name);
    groups.set(canon, bucket);
  }

  const nextMeta: Record<string, StoredHardSkillMeta> = { ...meta };
  const nextNames: string[] = [];
  let changed = rawNames.length !== groups.size;

  for (const [canon, originals] of groups) {
    nextNames.push(canon);
    const snapshots: Record<string, StoredHardSkillMeta> = {};
    let level: HardSkillLevel = "Débutant";
    let proofs: SkillProofItem[] = [];
    let target: HardSkillLevel | undefined;
    let started: string | undefined;
    let validation: StoredHardSkillMeta["validation"];
    let category = catalogCategoryFor(canon) ?? undefined;
    let referential = category;
    let source: StoredHardSkillMeta["source"] = "manual";

    for (const original of originals) {
      const row = meta[original];
      if (!row) continue;
      snapshots[original] = snapshotOf(row);
      if (row.legacySnapshots) Object.assign(snapshots, row.legacySnapshots);
      level = higherLevel(level, normalizeStoredLevel(row.level));
      proofs = proofs.concat(listSkillProofs(row));
      if (row.trainingTargetLevel) target = higherLevel(target, row.trainingTargetLevel);
      if (row.trainingStartedAt && (!started || row.trainingStartedAt < started)) started = row.trainingStartedAt;
      if (row.validation) validation = row.validation;
      if (row.category) category = row.category;
      if (row.referentialCategory) referential = row.referentialCategory;
      if (row.source === "catalog") source = "catalog";
      if (original !== canon) changed = true;
    }
    for (const original of originals) {
      if (original !== canon) delete nextMeta[original];
    }

    const seen = new Set<string>();
    const uniqueProofs = proofs.filter((proof) => {
      const key = `${proof.id}|${proof.url ?? ""}|${proof.title}|${proof.note ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const latest = uniqueProofs[uniqueProofs.length - 1];
    nextMeta[canon] = {
      level,
      category: category ?? "Autre",
      referentialCategory: referential ?? category ?? "Autre",
      source,
      proofLevel: uniqueProofs.length ? "justified" : "declared",
      proofs: uniqueProofs,
      proof: latest
        ? { type: latest.type, url: latest.url, note: latest.note }
        : undefined,
      trainingTargetLevel: target,
      trainingStartedAt: started,
      validation,
      legacySnapshots: Object.keys(snapshots).length ? snapshots : undefined,
    };
  }

  const proofsAfter = nextNames.reduce((sum, name) => sum + listSkillProofs(nextMeta[name]).length, 0);
  return {
    names: nextNames,
    meta: nextMeta,
    changed,
    before: rawNames.length,
    after: nextNames.length,
    proofsBefore,
    proofsAfter,
  };
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
