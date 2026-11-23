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
  /** Formation LMS rattachée à cette page cursus (courses.id). */
  lmsCourseId: string;
  lmsCourseTitle: string;
  candidaterHref: string;
};

const NTC = new Set(["ai_business", "sport_business", "real_estate"]);
const MEM = new Set(["retail_experience", "merchandising", "luxury_premium", "sport_retail"]);
const REM = new Set(["ai_management", "business_performance", "transition_innovation"]);
const RDC = new Set([
  "growth_acquisition",
  "entrepreneurship",
  "international_business",
  "strategic_partnerships",
]);

function familyLevel(specialization: CfaSpecialization): string {
  if (NTC.has(specialization) || MEM.has(specialization)) {
    return "Titre RNCP Niveau 5 (équivalent Bac+2)";
  }
  return "Titre RNCP Niveau 6 (équivalent Bac+3)";
}

function candidaterHref(specialization: CfaSpecialization): string {
  const params = new URLSearchParams({ specialization });
  if (NTC.has(specialization)) params.set("track", "ntc");
  if (MEM.has(specialization)) params.set("track", "mem");
  if (REM.has(specialization)) params.set("track", "rem");
  if (RDC.has(specialization)) params.set("track", "rdc");
  return `/ecole/candidater?${params.toString()}`;
}

/** Pages marketing publiques déjà en ligne (les autres filières suivront). */
export const BYOUND_PROGRAM_PUBLIC_PATHS: Partial<Record<CfaSpecialization, string>> = {
  ai_business: "/ecole/ntc/ai-business",
  sport_business: "/ecole/ntc/business-sport",
  real_estate: "/ecole/ntc/real-estate",
  retail_experience: "/ecole/mem/retail-experience",
  merchandising: "/ecole/mem/merchandising",
  luxury_premium: "/ecole/mem/luxury-premium",
  sport_retail: "/ecole/mem/sport-retail",
  ai_management: "/ecole/rem/ai-management",
  business_performance: "/ecole/rem/business-performance",
  transition_innovation: "/ecole/rem/transition-innovation",
  growth_acquisition: "/ecole/rdc/growth-acquisition",
  entrepreneurship: "/ecole/rdc/entrepreneurship",
  international_business: "/ecole/rdc/international-business",
  strategic_partnerships: "/ecole/rdc/strategic-partnerships",
};

export function byoundProgramPublicHref(specialization: CfaSpecialization): string | null {
  return BYOUND_PROGRAM_PUBLIC_PATHS[specialization] ?? null;
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
    lmsCourseId: "",
    lmsCourseTitle: "",
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
    lmsCourseId: String(row.lms_course_id ?? "").trim(),
    lmsCourseTitle: String(row.lms_course_title ?? "").trim(),
  };
}
