/** Valeurs stockées dans `profiles.type_profil`. */
export const PROFILE_SITUATION_OPTIONS = [
  { value: "alternance", label: "En alternance" },
  { value: "recherche_alternance", label: "En recherche d'alternance" },
  { value: "reconversion", label: "En reconversion" },
  { value: "emploi", label: "En poste" },
] as const;

export type ProfileSituationValue = (typeof PROFILE_SITUATION_OPTIONS)[number]["value"];

const LABEL_BY_VALUE: Record<string, string> = {
  alternance: "En alternance",
  recherche_alternance: "En recherche d'alternance",
  reconversion: "En reconversion",
  emploi: "En poste",
  freelance: "Freelance",
};

export function getProfileSituationLabel(value: string | null | undefined): string {
  const key = String(value ?? "").trim().toLowerCase();
  if (!key) return "—";
  return LABEL_BY_VALUE[key] ?? key;
}

export function normalizeProfileSituation(value: string | null | undefined): ProfileSituationValue | "" {
  const key = String(value ?? "").trim().toLowerCase();
  const allowed = PROFILE_SITUATION_OPTIONS.map((o) => o.value);
  if (allowed.includes(key as ProfileSituationValue)) {
    return key as ProfileSituationValue;
  }
  return "";
}
