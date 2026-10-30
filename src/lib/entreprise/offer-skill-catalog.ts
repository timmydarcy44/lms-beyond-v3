import { catalogCategoryFor, canonicalSkillName, foldSkillKey, searchPublicCatalog } from "@/lib/hard-skills/skill-catalog-policy";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

export type CatalogSkill = { label: string; kind: "soft" | "hard" };

const STOP = new Set(["pour", "avec", "dans", "vous", "votre", "poste", "les", "des", "une", "que", "sur", "par", "aux", "est", "son", "ses"]);

const softKeys = new Set(SOFT_SKILLS.map((skill) => foldSkillKey(skill.titre)));

export function offerSkillKind(label: string): "soft" | "hard" {
  const key = foldSkillKey(label);
  if (softKeys.has(key) || softKeys.has(foldSkillKey(canonicalSkillName(label)))) return "soft";
  const category = catalogCategoryFor(label);
  if (category && /soft/i.test(category) && softKeys.has(key)) return "soft";
  return "hard";
}

export function catalogPool(): CatalogSkill[] {
  const byKey = new Map<string, CatalogSkill>();
  for (const skill of SOFT_SKILLS) {
    byKey.set(foldSkillKey(skill.titre), { label: skill.titre, kind: "soft" });
  }
  for (const entry of searchPublicCatalog("")) {
    const key = foldSkillKey(entry.name);
    if (byKey.has(key)) continue;
    byKey.set(key, { label: entry.name, kind: offerSkillKind(entry.name) });
  }
  return [...byKey.values()];
}

export function findCatalogSkill(label: string): CatalogSkill | null {
  const key = foldSkillKey(canonicalSkillName(label));
  return catalogPool().find((skill) => foldSkillKey(skill.label) === key || foldSkillKey(canonicalSkillName(skill.label)) === key) ?? null;
}

export function suggestCatalogSkills(title: string, description: string, limit = 6): CatalogSkill[] {
  const titleTokens = foldSkillKey(title).split(" ").filter((token) => token.length > 2 && !STOP.has(token));
  const textTokens = foldSkillKey(`${title} ${description}`).split(" ").filter((token) => token.length > 3 && !STOP.has(token));
  return catalogPool()
    .map((skill) => {
      const name = foldSkillKey(skill.label);
      let score = 0;
      for (const token of titleTokens) {
        if (name.includes(token)) score += 5;
      }
      for (const token of textTokens) {
        if (name.includes(token)) score += 2;
      }
      return { skill, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.label.localeCompare(b.skill.label, "fr"))
    .slice(0, limit)
    .map((row) => row.skill);
}

export function searchCatalog(query: string, limit = 8): CatalogSkill[] {
  const raw = query.trim();
  if (raw.length < 1) return [];
  const tokens = foldSkillKey(raw).split(" ").filter(Boolean);
  return catalogPool()
    .map((skill) => {
      const name = foldSkillKey(skill.label);
      const score = tokens.reduce((total, token) => total + (name.startsWith(token) ? 3 : name.includes(token) ? 1 : -10), 0);
      return { skill, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.label.localeCompare(b.skill.label, "fr"))
    .slice(0, limit)
    .map((row) => row.skill);
}

export function sameSkill(left: string, right: string) {
  return foldSkillKey(canonicalSkillName(left)) === foldSkillKey(canonicalSkillName(right));
}
