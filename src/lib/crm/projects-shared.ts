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
  { slug: "communication", label: "Communication", cardClass: "from-sky-950 via-slate-900 to-sky-950 border-sky-400/30", badgeClass: "bg-sky-500/20 text-sky-200" },
  { slug: "commercial", label: "Commercial", cardClass: "from-indigo-950 via-slate-900 to-violet-950 border-indigo-400/30", badgeClass: "bg-indigo-500/20 text-indigo-200" },
  { slug: "marketing", label: "Marketing", cardClass: "from-fuchsia-950 via-slate-900 to-pink-950 border-fuchsia-400/30", badgeClass: "bg-fuchsia-500/20 text-fuchsia-200" },
  { slug: "reunion_travail", label: "Réunion de travail", cardClass: "from-amber-950 via-slate-900 to-orange-950 border-amber-400/30", badgeClass: "bg-amber-500/20 text-amber-200" },
  { slug: "autre", label: "Autre", cardClass: "from-slate-950 via-slate-900 to-slate-950 border-white/10", badgeClass: "bg-white/10 text-slate-200" },
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
