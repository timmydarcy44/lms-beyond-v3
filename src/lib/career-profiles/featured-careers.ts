/** Métiers proposés en dropdown sur le parcours apprenant. */
export const CAREER_DROPDOWN_OPTIONS: Array<{ slug: string; label: string }> = [
  { slug: "commercial-immobilier", label: "Commercial immobilier" },
  { slug: "commercial-b2b", label: "Commercial B2B" },
  { slug: "coach-sportif", label: "Commercial sport" },
  { slug: "charge-recrutement", label: "Chargé RH" },
  { slug: "assistant-rh", label: "Responsable RH" },
  { slug: "manager-equipe", label: "Manager" },
  { slug: "charge-projet-evenementiel", label: "Chef de projet" },
  { slug: "coach-sportif", label: "Coach sportif" },
  { slug: "community-manager", label: "Marketing digital" },
  { slug: "community-manager", label: "Community manager" },
  { slug: "responsable-communication", label: "Responsable communication" },
  { slug: "negociateur-immobilier", label: "Agent immobilier" },
  { slug: "entrepreneur-freelance", label: "Consultant IA" },
  { slug: "conseiller-commercial", label: "Formateur" },
  { slug: "conseiller-commercial", label: "Responsable pédagogique" },
  { slug: "conseiller-commercial", label: "Responsable qualité" },
  { slug: "infirmier", label: "Infirmier" },
  { slug: "manipulateur-radio", label: "Manip radio" },
  { slug: "kinesitherapeute", label: "Kinésithérapeute" },
  { slug: "ergotherapeute", label: "Ergothérapeute" },
  { slug: "psychologue", label: "Psychologue" },
];

export const FEATURED_CAREER_CHIPS = [
  { slug: "commercial-immobilier", label: "Commercial immobilier" },
  { slug: "conseiller-commercial", label: "Conseiller commercial" },
  { slug: "commercial-b2b", label: "Commercial B2B" },
  { slug: "charge-recrutement", label: "Chargé de recrutement" },
  { slug: "manager-equipe", label: "Manager d'équipe" },
  { slug: "assistant-rh", label: "Assistant RH" },
  { slug: "community-manager", label: "Community manager" },
  { slug: "responsable-communication", label: "Responsable communication" },
  { slug: "coach-sportif", label: "Coach sportif" },
  { slug: "entrepreneur-freelance", label: "Entrepreneur / freelance" },
] as const;

export const CAREER_OTHER_VALUE = "__autre__";

export function getCareerDropdownOptions(): Array<{ id: string; slug: string; label: string }> {
  return CAREER_DROPDOWN_OPTIONS.map((opt, index) => ({
    id: `${opt.slug}-${index}`,
    slug: opt.slug,
    label: opt.label,
  }));
}

/** @deprecated */
export function getUniqueCareerDropdownOptions(): Array<{ slug: string; label: string }> {
  return getCareerDropdownOptions().map(({ slug, label }) => ({ slug, label }));
}
