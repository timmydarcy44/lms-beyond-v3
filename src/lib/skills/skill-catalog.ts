import { getServiceRoleClient } from "@/lib/supabase/server";
import { normalizeSkillText } from "@/lib/skills/normalize";

export type SkillRow = {
  id: string;
  slug: string;
  label: string;
  description: string;
  aliases: string[];
  is_soft: boolean;
  domain_id: string;
  domain_slug: string;
  domain_label: string;
  domain_position: number;
  position: number;
};

export async function loadActiveSkills(): Promise<SkillRow[]> {
  const db = getServiceRoleClient();
  if (!db) return [];
  const { data, error } = await db
    .from("skills")
    .select(
      "id, slug, label, description, aliases, is_soft, position, domain_id, skill_domains!inner(slug, label, position)",
    )
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => {
    const domain = row.skill_domains as unknown as {
      slug: string;
      label: string;
      position: number;
    };
    return {
      id: String(row.id),
      slug: String(row.slug),
      label: String(row.label),
      description: String(row.description ?? ""),
      aliases: Array.isArray(row.aliases) ? (row.aliases as string[]) : [],
      is_soft: Boolean(row.is_soft),
      domain_id: String(row.domain_id),
      domain_slug: String(domain?.slug ?? ""),
      domain_label: String(domain?.label ?? ""),
      domain_position: Number(domain?.position ?? 0),
      position: Number(row.position ?? 0),
    };
  });
}

export function buildCatalogPayload(skills: SkillRow[]) {
  const domainMap = new Map<
    string,
    {
      id: string;
      slug: string;
      label: string;
      position: number;
      skills: Array<{
        id: string;
        slug: string;
        label: string;
        description: string;
        aliases: string[];
        is_soft: boolean;
      }>;
    }
  >();
  for (const skill of skills) {
    if (skill.is_soft) continue;
    const key = skill.domain_id;
    if (!domainMap.has(key)) {
      domainMap.set(key, {
        id: skill.domain_id,
        slug: skill.domain_slug,
        label: skill.domain_label,
        position: skill.domain_position,
        skills: [],
      });
    }
    domainMap.get(key)!.skills.push({
      id: skill.id,
      slug: skill.slug,
      label: skill.label,
      description: skill.description,
      aliases: skill.aliases,
      is_soft: skill.is_soft,
    });
  }
  const domains = [...domainMap.values()].sort((a, b) => a.position - b.position);
  const softSkills = skills
    .filter((s) => s.is_soft)
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      label: s.label,
      description: s.description,
      aliases: s.aliases,
      is_soft: true,
    }));
  return { domains, softSkills };
}

export type LocalMatch = {
  skill: SkillRow;
  confidence: number;
};

/** Correspondance exacte / alias / inclusion. */
export function matchSkillsLocally(
  text: string,
  skills: SkillRow[],
  kind: "hard" | "soft",
): LocalMatch[] {
  const needle = normalizeSkillText(text);
  if (!needle) return [];
  const pool = skills.filter((s) => (kind === "soft" ? s.is_soft : !s.is_soft));
  const scored: LocalMatch[] = [];
  for (const skill of pool) {
    const labels = [skill.label, ...skill.aliases].map(normalizeSkillText).filter(Boolean);
    let confidence = 0;
    for (const label of labels) {
      if (label === needle) {
        confidence = Math.max(confidence, 1);
        break;
      }
      if (label.includes(needle) || needle.includes(label)) {
        const ratio = Math.min(label.length, needle.length) / Math.max(label.length, needle.length);
        confidence = Math.max(confidence, Math.min(0.92, 0.7 + ratio * 0.2));
      }
    }
    if (confidence > 0) scored.push({ skill, confidence });
  }
  scored.sort((a, b) => b.confidence - a.confidence || a.skill.label.localeCompare(b.skill.label));
  return scored;
}
