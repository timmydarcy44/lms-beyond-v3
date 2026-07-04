export type ProfilEdgeExploration = {
  id: "comportemental" | "soft_skills" | "motivation";
  label: string;
  introHref: string;
  done: boolean;
};

export function buildProfilEdgeExplorations(flags: {
  hasDisc: boolean;
  hasSoftSkills: boolean;
  hasIdmc: boolean;
}): ProfilEdgeExploration[] {
  return [
    {
      id: "comportemental",
      label: "Profil comportemental",
      introHref: "/dashboard/apprenant/test-comportemental-intro",
      done: flags.hasDisc,
    },
    {
      id: "soft_skills",
      label: "Soft skills",
      introHref: "/dashboard/apprenant/soft-skills-intro",
      done: flags.hasSoftSkills,
    },
    {
      id: "motivation",
      label: "Motivation / fonctionnement",
      introHref: "/dashboard/apprenant/idmc-intro",
      done: flags.hasIdmc,
    },
  ];
}

export function countCompletedExplorations(explorations: ProfilEdgeExploration[]): number {
  return explorations.filter((e) => e.done).length;
}

export function isProfilEdgeComplete(explorations: ProfilEdgeExploration[]): boolean {
  return countCompletedExplorations(explorations) === explorations.length;
}

export function profilEdgeProgressLabel(completed: number, total = 3): string {
  if (completed >= total) return "Profil EDGE complet";
  return `Profil EDGE en cours — ${completed}/${total} explorations complétées`;
}
