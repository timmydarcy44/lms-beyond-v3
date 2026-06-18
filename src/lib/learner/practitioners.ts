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
    title: row.titre?.trim() || "Praticien certifié EDGE",
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
    photoUrl: "/jessica-contentin/jessica-portrait.jpg",
  },
  {
    id: "timmy-darcy",
    name: "Timmy Darcy",
    title: "Coach professionnel — performance",
    bio: "Coach certifié EDGE, accompagnement des parcours professionnels et montée en compétences.",
    specialites: ["Leadership", "Communication", "Orientation carrière", "Soft skills"],
    photoUrl: null,
  },
  {
    id: "jerome-picot",
    name: "Jérôme Picot",
    title: "Consultant management & transformation",
    bio: "Expert management et conduite du changement pour managers et collaborateurs.",
    specialites: ["Management", "Conflits", "Performance d'équipe", "Pilotage"],
    photoUrl: null,
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
