import type { QualiopiActivityKey, QualiopiIndicatorDef } from "@/lib/qualiopi/indicators";
import { QUALIOPI_INDICATORS } from "@/lib/qualiopi/indicators";

export type QualiopiActivityProfile = Record<QualiopiActivityKey, boolean>;

export const DEFAULT_QUALIOPI_ACTIVITIES: QualiopiActivityProfile = {
  of: true,
  cfa: true,
  vae: false,
  bilan: false,
  certifying: false,
  pfst: false,
};

export const ACTIVITY_LABELS: Record<QualiopiActivityKey, string> = {
  of: "Organisme de formation",
  cfa: "CFA",
  vae: "VAE",
  bilan: "Bilan de compétences",
  certifying: "Certifiant",
  pfst: "PFST",
};

export function parseActivityProfile(raw: unknown): QualiopiActivityProfile {
  const base = { ...DEFAULT_QUALIOPI_ACTIVITIES };
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(base) as QualiopiActivityKey[]) {
    if (typeof obj[key] === "boolean") base[key] = obj[key];
  }
  return base;
}

/** Un indicateur est applicable s’il est commun, ou si au moins une activité requise est active. */
export function isIndicatorApplicable(
  indicator: QualiopiIndicatorDef,
  profile: QualiopiActivityProfile,
): boolean {
  if (!indicator.requiredActivities || indicator.requiredActivities.length === 0) {
    return true;
  }
  return indicator.requiredActivities.some((a) => profile[a] === true);
}

export function listNaIndicators(profile: QualiopiActivityProfile) {
  return QUALIOPI_INDICATORS.filter((i) => !isIndicatorApplicable(i, profile));
}

export function listApplicableIndicators(profile: QualiopiActivityProfile) {
  return QUALIOPI_INDICATORS.filter((i) => isIndicatorApplicable(i, profile));
}

export function activeActivityLabels(profile: QualiopiActivityProfile): string[] {
  return (Object.keys(profile) as QualiopiActivityKey[])
    .filter((k) => profile[k] && k !== "certifying" && k !== "pfst")
    .map((k) => ACTIVITY_LABELS[k]);
}
