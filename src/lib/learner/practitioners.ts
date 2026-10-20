export type SalariePractitioner = {
  id: string;
  name: string;
  title: string;
  bio: string;
  specialites: string[];
  photoUrl: string | null;
};

export type SalariePractitionerRow = {
  id: string;
  prenom: string;
  nom: string;
  photo_url: string | null;
  titre: string | null;
  biographie: string | null;
  specialites: string[] | null;
};

export function mapPractitionerRow(row: SalariePractitionerRow): SalariePractitioner {
  return {
    id: row.id,
    name: [row.prenom, row.nom].filter(Boolean).join(" ").trim(),
    title: row.titre?.trim() || "Praticien certifié Byound",
    bio: row.biographie?.trim() || "",
    specialites: row.specialites ?? [],
    photoUrl: row.photo_url,
  };
}

/** Fallback si la table n'est pas encore migrée en prod. */
export const SALARIE_PRACTITIONERS_FALLBACK: SalariePractitioner[] = [
  {
    id: "jessica-contentin",
    name: "Jessica Contentin",
    title: "Psychopédagogue — neuroéducation",
    bio: "Psychopédagogue certifiée, spécialisée en gestion des émotions et accompagnement TND.",
    specialites: ["Gestion des émotions", "TDA-H", "Confiance en soi", "Phobie scolaire"],
    photoUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&h=1200&q=80",
  },
  {
    id: "timmy-darcy",
    name: "Timmy Darcy",
    title: "Coach professionnel — performance",
    bio: "Coach certifié Byound, accompagnement des parcours professionnels et montée en compétences.",
    specialites: ["Leadership", "Communication", "Orientation carrière", "Soft skills"],
    photoUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&h=1200&q=80",
  },
  {
    id: "jerome-picot",
    name: "Jérôme Picot",
    title: "Consultant management & transformation",
    bio: "Expert management et conduite du changement pour managers et collaborateurs.",
    specialites: ["Management", "Conflits", "Performance d'équipe", "Pilotage"],
    photoUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=900&h=1200&q=80",
  },
  {
    id: "camille-bernard",
    name: "Camille Bernard",
    title: "Coach commerciale",
    bio: "Prospection, closing et objections pour les équipes qui vendent des parcours.",
    specialites: ["Prospection", "Closing", "Négociation"],
    photoUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=900&h=1200&q=80",
  },
  {
    id: "ines-morel",
    name: "Inès Morel",
    title: "Praticienne prise de parole",
    bio: "Présence, pitch et prise de parole devant un comité ou un client.",
    specialites: ["Prise de parole", "Pitch", "Storytelling"],
    photoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&h=1200&q=80",
  },
  {
    id: "lea-martin",
    name: "Léa Martin",
    title: "Coach productivité",
    bio: "Organisation du temps, priorités et rituels de travail.",
    specialites: ["Organisation", "Priorisation", "Charge mentale"],
    photoUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&h=1200&q=80",
  },
  {
    id: "hugo-renard",
    name: "Hugo Renard",
    title: "Praticien IA métier",
    bio: "Usage concret de l'IA dans les tâches commerciales et le reporting.",
    specialites: ["IA", "CRM", "Reporting"],
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&h=1200&q=80",
  },
];

export function collectSpecialites(practitioners: SalariePractitioner[]): string[] {
  const set = new Set<string>();
  for (const p of practitioners) {
    for (const s of p.specialites) set.add(s);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
}

export function filterPractitionersByQuery(
  practitioners: SalariePractitioner[],
  query: string,
): SalariePractitioner[] {
  const q = query.trim().toLowerCase();
  if (!q) return practitioners;
  return practitioners.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.bio.toLowerCase().includes(q) ||
      p.specialites.some((s) => s.toLowerCase().includes(q)),
  );
}

export function pickPractitionerForNeed(
  practitioners: SalariePractitioner[],
  need: string,
): SalariePractitioner | null {
  if (!practitioners.length) return null;
  const q = need.toLowerCase();
  const scored = practitioners.map((p) => {
    let score = 0;
    for (const s of p.specialites) {
      const sl = s.toLowerCase();
      if (sl.includes(q) || q.includes(sl)) score += 3;
      if (/émotion|stress|empathie/i.test(q) && /émotion|stress|confiance/i.test(sl)) score += 2;
      if (/leadership|conflit|communication|management/i.test(q) && /leadership|conflit|communication|management|pilotage/i.test(sl)) score += 2;
    }
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score ? scored[0].p : practitioners[0];
}
