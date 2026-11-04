import type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
import { parseExpertDocuments } from "@/lib/expert/admin-expert-types";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import { EXPERT_DOMAINS, getDomainById, getSpecialtyLabel, parseSpecialtyKey } from "@/lib/expert/specialties-referential";

const CURSUS_LABELS = new Set<string>(CFA_SPECIALIZATIONS.map((item) => item.label));

export type ProfileCheck = { id: string; ok: boolean; missing: string };

export function expertProfileChecks(
  expert: AdminExpertRow,
  portfolioUrl: string | null,
  cursusCount: number,
): ProfileCheck[] {
  const skills = skillLabels(expert.specialties);
  const documents = parseExpertDocuments(expert.references);
  return [
    { id: "photo", ok: Boolean(expert.photo_url || expert.avatar_url), missing: "la photo" },
    { id: "presentation", ok: Boolean(expert.bio || expert.bio_long), missing: "la présentation" },
    { id: "skills", ok: skills.length > 0 || expertDomains(expert).length > 0, missing: "les compétences" },
    { id: "cursus", ok: cursusCount > 0, missing: "un cursus" },
    { id: "documents", ok: documents.length > 0, missing: "les documents" },
    { id: "link", ok: Boolean(expert.linkedin_url || portfolioUrl), missing: "LinkedIn ou le portfolio" },
  ];
}

export function skillLabels(specialties: string[] | null | undefined): string[] {
  return (specialties ?? []).map((item) => getSpecialtyLabel(String(item))).filter((item) => item && !CURSUS_LABELS.has(item));
}

export function expertDomains(expert: AdminExpertRow): string[] {
  const references = Array.isArray(expert.references) ? expert.references : [];
  const meta = references.find(
    (item) => item && typeof item === "object" && (item as { _type?: string })._type === "edge_registration_meta",
  ) as { domains?: unknown; primary_domain?: unknown } | undefined;
  if (Array.isArray(meta?.domains)) return meta.domains.map((item) => String(item)).filter(Boolean);
  if (meta?.primary_domain) return [String(meta.primary_domain)];
  return [];
}

export type SkillCard = { id: string; label: string; color: string; specialties: string[] };

const DOMAIN_COLORS = ["#5EDCC3", "#6BE39B", "#A99BFF", "#8DB8FF", "#F2CF6B", "#F2A3C7", "#8B7BFF", "#F5C85C"];

function domainColor(label: string): string {
  const known = EXPERT_DOMAINS.findIndex((domain) => domain.id === label || domain.label === label);
  if (known >= 0) return DOMAIN_COLORS[known % DOMAIN_COLORS.length]!;
  let hash = 0;
  for (const char of label) hash = (hash + char.charCodeAt(0)) % DOMAIN_COLORS.length;
  return DOMAIN_COLORS[hash]!;
}

function domainLabel(idOrLabel: string): string {
  return getDomainById(idOrLabel)?.label ?? EXPERT_DOMAINS.find((domain) => domain.label === idOrLabel)?.label ?? idOrLabel;
}

export function skillCards(expert: AdminExpertRow): SkillCard[] {
  const groups = new Map<string, string[]>();
  const push = (label: string, specialty: string) => {
    const current = groups.get(label) ?? [];
    if (!current.includes(specialty)) current.push(specialty);
    groups.set(label, current);
  };

  for (const raw of expert.specialties ?? []) {
    const value = String(raw);
    if (CURSUS_LABELS.has(value) || CURSUS_LABELS.has(getSpecialtyLabel(value))) continue;
    const parsed = parseSpecialtyKey(value);
    if (parsed) {
      push(domainLabel(parsed.domainId), parsed.label);
      continue;
    }
    const match = EXPERT_DOMAINS.find((domain) => domain.specialties.includes(value));
    push(match?.label ?? "Autres", value);
  }

  for (const domain of expertDomains(expert)) {
    const label = domainLabel(domain);
    if (!groups.has(label)) groups.set(label, []);
  }

  return [...groups.entries()].map(([label, specialties]) => ({
    id: label,
    label,
    color: domainColor(label),
    specialties,
  }));
}
