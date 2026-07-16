export const CRM_PROJECT_STAGES = [
  { slug: "projet_a_definir", label: "Projet à définir", sort_order: 0 },
  { slug: "a_faire", label: "À faire", sort_order: 1 },
  { slug: "en_cours", label: "En cours", sort_order: 2 },
  { slug: "en_attente", label: "En attente", sort_order: 3 },
  { slug: "terminee", label: "Terminée", sort_order: 4 },
  { slug: "inachevee", label: "Inachevée", sort_order: 5 },
] as const;

export type CrmProjectStageSlug = (typeof CRM_PROJECT_STAGES)[number]["slug"];

export const CRM_PROJECT_TOPICS = [
  {
    slug: "communication",
    label: "Communication",
    cardClass:
      "border-l-4 border-l-sky-400 border-sky-500/35 bg-gradient-to-br from-sky-700 via-sky-900 to-slate-950",
    badgeClass: "bg-sky-500/30 text-sky-100",
  },
  {
    slug: "commercial",
    label: "Commercial",
    cardClass:
      "border-l-4 border-l-indigo-400 border-indigo-500/35 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950",
    badgeClass: "bg-indigo-500/30 text-indigo-100",
  },
  {
    slug: "marketing",
    label: "Marketing",
    cardClass:
      "border-l-4 border-l-fuchsia-400 border-fuchsia-500/35 bg-gradient-to-br from-fuchsia-700 via-fuchsia-900 to-slate-950",
    badgeClass: "bg-fuchsia-500/30 text-fuchsia-100",
  },
  {
    slug: "reunion_travail",
    label: "Réunion de travail",
    cardClass:
      "border-l-4 border-l-amber-400 border-amber-500/35 bg-gradient-to-br from-amber-700 via-amber-900 to-slate-950",
    badgeClass: "bg-amber-500/30 text-amber-100",
  },
  {
    slug: "autre",
    label: "Autre",
    cardClass:
      "border-l-4 border-l-slate-400 border-white/15 bg-gradient-to-br from-slate-600 via-slate-800 to-slate-950",
    badgeClass: "bg-white/15 text-slate-200",
  },
] as const;

export type CrmProjectTopicSlug = (typeof CRM_PROJECT_TOPICS)[number]["slug"];

export type CrmProject = {
  id: string;
  title: string;
  description: string | null;
  stage_slug: CrmProjectStageSlug;
  topic_slug: CrmProjectTopicSlug;
  sort_order: number;
  owner_email: string | null;
  created_at: string;
  updated_at: string;
};

export function projectStageLabel(slug: string): string {
  return CRM_PROJECT_STAGES.find((s) => s.slug === slug)?.label ?? slug;
}

export function projectTopicMeta(slug: string) {
  return CRM_PROJECT_TOPICS.find((t) => t.slug === slug) ?? CRM_PROJECT_TOPICS[CRM_PROJECT_TOPICS.length - 1];
}
