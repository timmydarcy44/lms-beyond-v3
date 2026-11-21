import type { CareDomain } from "@/lib/care/domains";
import { foldCareText } from "@/lib/care/directory-search";
import type { CareSubjectColorId } from "@/lib/apprenant/care-theme";
import { CARE_THEME } from "@/lib/apprenant/care-theme";

/**
 * Sujets LMS « De quoi as-tu besoin ? ».
 * Filtrage local sur l’annuaire care_profiles (même source que byoundcare.fr),
 * via domaines Care + mots-clés — jamais persisté en base.
 */
export type CareLmsSubjectId =
  | "stress"
  | "decision"
  | "confiance"
  | "equilibre"
  | "apprendre"
  | "orienter";

export type CareLmsSubject = {
  id: CareLmsSubjectId;
  label: string;
  description: string;
  color: string;
  colorVar: CareSubjectColorId;
  domains: CareDomain[];
  keywords: string[];
  specialtyHints: string[];
};

export const CARE_LMS_SUBJECTS: CareLmsSubject[] = [
  {
    id: "stress",
    label: "Stress et charge mentale",
    description: "Trop de choses à gérer, du mal à décrocher",
    color: CARE_THEME.subjects.stress,
    colorVar: "stress",
    domains: ["emotions"],
    keywords: ["stress", "charge mentale", "rumination", "sommeil", "anxiete", "anxiété"],
    specialtyHints: ["Stress", "Organisation", "Sommeil"],
  },
  {
    id: "decision",
    label: "Une décision à prendre",
    description: "Orientation, projet pro, suite du parcours",
    color: CARE_THEME.subjects.decision,
    colorVar: "decision",
    domains: ["carriere"],
    keywords: ["orientation", "decision", "décision", "reconversion", "projet", "carriere", "carrière"],
    specialtyHints: ["Orientation", "Projet pro", "Transitions"],
  },
  {
    id: "confiance",
    label: "Confiance et prise de parole",
    description: "Entretien, oral, réunion qui stresse",
    color: CARE_THEME.subjects.confiance,
    colorVar: "confiance",
    domains: ["emotions", "performance"],
    keywords: ["confiance", "prise de parole", "entretien", "oral", "communication"],
    specialtyHints: ["Confiance", "Prise de parole", "Entretien"],
  },
  {
    id: "equilibre",
    label: "Équilibre vie perso et formation",
    description: "Famille, rythme, organisation",
    color: CARE_THEME.subjects.equilibre,
    colorVar: "equilibre",
    domains: ["famille"],
    keywords: ["equilibre", "équilibre", "famille", "rythme", "parentalite", "parentalité"],
    specialtyHints: ["Famille", "Rythme", "Organisation"],
  },
  {
    id: "apprendre",
    label: "Apprendre autrement",
    description: "Concentration, mémoire, DYS, méthodes",
    color: CARE_THEME.subjects.apprendre,
    colorVar: "apprendre",
    domains: ["attention"],
    keywords: [
      "concentration",
      "memoire",
      "mémoire",
      "dys",
      "neuro",
      "apprentissage",
      "methodes",
      "méthodes",
      "attention",
      "tdah",
    ],
    specialtyHints: ["Concentration", "Méthodes d’apprentissage", "Neuroéducation"],
  },
  {
    id: "orienter",
    label: "Je ne sais pas trop",
    description: "Un premier échange pour t’orienter",
    color: CARE_THEME.subjects.orienter,
    colorVar: "orienter",
    domains: [],
    keywords: ["premier echange", "premier échange", "bilan", "orientation"],
    specialtyHints: ["Premier échange", "Orientation"],
  },
];

export const CARE_LMS_DEFAULT_SUBJECT: CareLmsSubjectId = "stress";

const DOMAIN_TAG: Record<CareDomain, string> = {
  emotions: "Stress",
  attention: "Concentration",
  famille: "Famille",
  performance: "Performance",
  carriere: "Orientation",
};

export function isCareLmsSubjectId(value: string | null | undefined): value is CareLmsSubjectId {
  return CARE_LMS_SUBJECTS.some((subject) => subject.id === value);
}

export function getCareLmsSubject(id: string | null | undefined): CareLmsSubject {
  return CARE_LMS_SUBJECTS.find((subject) => subject.id === id) ?? CARE_LMS_SUBJECTS[0];
}

export type CareLmsMatchInput = {
  domains?: string[] | null;
  title?: string | null;
  tagline?: string | null;
  headline?: string | null;
  serviceNames?: string[] | null;
  city?: string | null;
};

function practitionerHaystack(input: CareLmsMatchInput) {
  return foldCareText(
    [
      ...(input.domains ?? []),
      input.title ?? "",
      input.tagline ?? "",
      input.headline ?? "",
      input.city ?? "",
      ...(input.serviceNames ?? []),
    ].join(" "),
  );
}

/** Filtre local — aucun écriture DB, aucun log sujet ↔ apprenant. */
export function matchesCareLmsSubject(input: CareLmsMatchInput, subjectId: CareLmsSubjectId) {
  if (subjectId === "orienter") return true;
  const subject = getCareLmsSubject(subjectId);
  const domains = (input.domains ?? []).map(String);
  if (subject.domains.some((domain) => domains.includes(domain))) return true;
  const hay = practitionerHaystack(input);
  return subject.keywords.some((keyword) => hay.includes(foldCareText(keyword)));
}

export function careLmsSpecialtyTags(input: CareLmsMatchInput, subjectId: CareLmsSubjectId): string[] {
  const subject = getCareLmsSubject(subjectId);
  const fromDomains = (input.domains ?? [])
    .map((id) => DOMAIN_TAG[id as CareDomain])
    .filter(Boolean);
  const hay = practitionerHaystack(input);
  const fromHints = subject.specialtyHints.filter((hint) => {
    const folded = foldCareText(hint);
    return hay.includes(folded) || fromDomains.some((tag) => foldCareText(tag) === folded);
  });
  const merged = [...fromHints, ...fromDomains, ...subject.specialtyHints];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const tag of merged) {
    const key = foldCareText(tag);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= 3) break;
  }
  return tags;
}
