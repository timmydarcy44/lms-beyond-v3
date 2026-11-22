import { getServiceRoleClient } from "@/lib/supabase/server";

export type SkillRow = {
  id: string;
  slug: string;
  label: string;
  description: string;
  aliases: string[];
  is_soft: boolean;
  domain_id: string;
  domain_slug?: string;
  domain_label?: string;
};

export type DomainWithSkills = {
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
};

export async function loadActiveSkills(): Promise<SkillRow[]> {
  const db = getServiceRoleClient();
  if (!db) return [];
  const { data: domains } = await db
    .from("skill_domains")
    .select("id, slug, label, position")
    .order("position");
  const { data: skills } = await db
    .from("skills")
    .select("id, domain_id, slug, label, description, aliases, is_soft")
    .eq("is_active", true)
    .order("position");
  const domainById = new Map((domains ?? []).map((d) => [String(d.id), d]));
  return (skills ?? []).map((s) => {
    const domain = domainById.get(String(s.domain_id));
    return {
      id: String(s.id),
      slug: String(s.slug),
      label: String(s.label),
      description: String(s.description ?? ""),
      aliases: Array.isArray(s.aliases) ? (s.aliases as string[]) : [],
      is_soft: Boolean(s.is_soft),
      domain_id: String(s.domain_id),
      domain_slug: domain ? String(domain.slug) : undefined,
      domain_label: domain ? String(domain.label) : undefined,
    };
  });
}

export async function loadCatalogPayload(opts?: { specialization?: string | null }) {
  const db = getServiceRoleClient();
  if (!db) return { domains: [] as DomainWithSkills[], softSkills: [], frequent: [] as SkillRow[] };

  const [{ data: domains }, { data: skills }] = await Promise.all([
    db.from("skill_domains").select("id, slug, label, position").order("position"),
    db
      .from("skills")
      .select("id, domain_id, slug, label, description, aliases, is_soft, position")
      .eq("is_active", true)
      .order("position"),
  ]);

  const byDomain = new Map<string, DomainWithSkills>();
  for (const d of domains ?? []) {
    byDomain.set(String(d.id), {
      id: String(d.id),
      slug: String(d.slug),
      label: String(d.label),
      position: Number(d.position) || 0,
      skills: [],
    });
  }
  const softSkills: DomainWithSkills["skills"] = [];
  for (const s of skills ?? []) {
    const row = {
      id: String(s.id),
      slug: String(s.slug),
      label: String(s.label),
      description: String(s.description ?? ""),
      aliases: Array.isArray(s.aliases) ? (s.aliases as string[]) : [],
      is_soft: Boolean(s.is_soft),
    };
    if (row.is_soft) softSkills.push(row);
    const domain = byDomain.get(String(s.domain_id));
    if (domain && !row.is_soft) domain.skills.push(row);
  }

  // Fréquentes : top déclarations matched (global) — fallback vide si table absente
  let frequent: Array<{ id: string; label: string }> = [];
  try {
    const { data: top } = await db
      .from("skill_declarations")
      .select("skill_id")
      .eq("match_status", "matched")
      .not("skill_id", "is", null)
      .limit(500);
    const counts = new Map<string, number>();
    for (const row of top ?? []) {
      const id = String((row as { skill_id?: string }).skill_id ?? "");
      if (!id) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const byId = new Map((skills ?? []).map((s) => [String(s.id), s]));
    frequent = ranked
      .map(([id]) => {
        const s = byId.get(id);
        return s ? { id, label: String(s.label) } : null;
      })
      .filter(Boolean) as Array<{ id: string; label: string }>;
  } catch {
    frequent = [];
  }

  void opts;
  return {
    domains: [...byDomain.values()]
      .filter((d) => d.slug !== "soft-skills")
      .sort((a, b) => a.position - b.position),
    softSkills,
    frequent,
  };
}
