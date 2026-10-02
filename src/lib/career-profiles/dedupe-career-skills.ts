/** Fusionne les libellés proches / doublons EN-FR dans un référentiel métier. */

const CANONICAL_BY_NORMALIZED: Record<string, string> = {
  "community management": "gestion des réseaux sociaux",
  "social media management": "gestion des réseaux sociaux",
  "community engagement": "animation communauté",
  "content strategy": "stratégie de contenu",
  "gestion de communaute": "animation communauté",
  "gestion communaute": "animation communauté",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Retire les doublons sémantiques (ex. « community management » vs « gestion des réseaux sociaux »,
 * ou long libellé contenant une compétence déjà listée).
 */
export function dedupeCareerExpectedSkills(skills: string[]): string[] {
  let list = skills.map((s) => s.trim()).filter(Boolean);

  list = list.map((skill) => {
    const n = normalize(skill);
    return CANONICAL_BY_NORMALIZED[n] ?? skill;
  });

  const byNorm = new Map<string, string>();
  for (const skill of list) {
    const n = normalize(skill);
    if (!byNorm.has(n)) byNorm.set(n, skill);
  }
  list = [...byNorm.values()];

  list.sort((a, b) => a.length - b.length);
  const kept: string[] = [];

  for (const skill of list) {
    const n = normalize(skill);
    let skip = false;

    for (let i = 0; i < kept.length; i += 1) {
      const kn = normalize(kept[i]);
      if (kn === n) {
        skip = true;
        break;
      }
      const overlap = kn.length >= 4 && n.length >= 4 && (kn.includes(n) || n.includes(kn));
      if (!overlap) continue;

      if (n.length > kn.length) {
        skip = true;
        break;
      }
      kept.splice(i, 1);
      i -= 1;
    }

    if (!skip) kept.push(skill);
  }

  return kept;
}
