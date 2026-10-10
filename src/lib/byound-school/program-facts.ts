import {
  CFA_SPECIALIZATIONS,
  type CfaSpecialization,
} from "@/lib/cfa-applications";

export const BYOUND_SCHOOL_ADDRESS = {
  name: "Byound School",
  street: "134 Rue Elise Déroche",
  city: "14760 - Bretteville sur Odon",
} as const;

export type ByoundProgramFacts = {
  specialization: CfaSpecialization;
  title: string;
  group: string;
  format: string;
  nextIntake: string;
  duration: string;
  volume: string;
  rhythm: string;
  location: string;
  level: string;
  seatsAvailable: string;
  programPdfUrl: string;
  heroImageUrl: string;
  candidaterHref: string;
};

const NTC = new Set(["ai_business", "sport_business", "real_estate"]);
const MEM = new Set(["retail_experience", "merchandising", "luxury_premium"]);

function familyLevel(specialization: CfaSpecialization): string {
  if (NTC.has(specialization) || MEM.has(specialization)) {
    return "Titre RNCP Niveau 5 (équivalent Bac+2)";
  }
  return "Titre RNCP Niveau 6 (équivalent Bac+3)";
}

function candidaterHref(specialization: CfaSpecialization): string {
  const params = new URLSearchParams({ specialization });
  if (NTC.has(specialization)) params.set("track", "ntc");
  return `/ecole/candidater?${params.toString()}`;
}

export function defaultByoundProgramFacts(
  specialization: CfaSpecialization,
): ByoundProgramFacts {
  const item = CFA_SPECIALIZATIONS.find((entry) => entry.value === specialization);
  return {
    specialization,
    title: item?.label ?? specialization,
    group: item?.group ?? "",
    format: "Alternance ou Initial",
    nextIntake: "Lundi 4 janvier 2027",
    duration: "12 mois",
    volume: NTC.has(specialization) ? "474 h" : "500 h",
    rhythm: "1 journée de cours/semaine",
    location: "Byound",
    level: familyLevel(specialization),
    seatsAvailable: "15",
    programPdfUrl: "",
    heroImageUrl: "",
    candidaterHref: candidaterHref(specialization),
  };
}

export function allDefaultByoundProgramFacts(): ByoundProgramFacts[] {
  return CFA_SPECIALIZATIONS.map((item) => defaultByoundProgramFacts(item.value));
}

export function mergeByoundProgramFacts(
  specialization: CfaSpecialization,
  row: Record<string, unknown> | null | undefined,
): ByoundProgramFacts {
  const defaults = defaultByoundProgramFacts(specialization);
  if (!row) return defaults;
  const text = (key: string, fallback: string) => {
    const value = String(row[key] ?? "").trim();
    return value || fallback;
  };
  return {
    ...defaults,
    format: text("format", defaults.format),
    nextIntake: text("next_intake", defaults.nextIntake),
    duration: text("duration", defaults.duration),
    volume: text("volume", defaults.volume),
    rhythm: text("rhythm", defaults.rhythm),
    location: text("location", defaults.location),
    level: text("level", defaults.level),
    seatsAvailable: text("seats_available", defaults.seatsAvailable),
    programPdfUrl: String(row.program_pdf_url ?? "").trim(),
    heroImageUrl: String(row.hero_image_url ?? "").trim(),
  };
}
