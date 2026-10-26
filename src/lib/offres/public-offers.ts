import type { SupabaseClient } from "@supabase/supabase-js";
import { getCfaSpecializationLabel } from "@/lib/cfa-applications";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

export type PublicOffer = {
  slug: string;
  title: string;
  sector: string;
  sizeLabel: string;
  city: string;
  contractType: string;
  duration: string;
  startLabel: string;
  workMode: string;
  hours: string;
  payLabel: string;
  benefits: string[];
  description: string;
  missions: string[];
  skills: string[];
  softSkills: string[];
  steps: { title: string; detail: string }[];
  cursus: string;
  publishedAt: string;
};

const COLUMNS =
  "slug, title, sector, size_label, city, contract_type, contract_duration, start_label, work_mode, hours_per_week, pay_label, benefits, description, diploma_prepared, recruitment_steps, soft_skill_ids, published_at, skills";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function splitMissions(description: string) {
  const lines = description.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const missions = lines.filter((line) => /^[-•*]/.test(line)).map((line) => line.replace(/^[-•*]\s*/, ""));
  if (missions.length < 2) return { description, missions: [] as string[] };
  const prose = lines.filter((line) => !/^[-•*]/.test(line)).join("\n");
  return { description: prose || description, missions: missions.slice(0, 6) };
}

function labels(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : text((item as { label?: unknown }).label)))
    .map((item) => item.trim())
    .filter(Boolean);
}

function stepsOf(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as { title?: unknown; detail?: unknown };
      return { title: text(row.title), detail: text(row.detail) };
    })
    .filter((step) => step.title)
    .slice(0, 6);
}

function softSkills(value: unknown) {
  const ids = new Set(Array.isArray(value) ? value.map((item) => String(item)) : []);
  return SOFT_SKILLS.filter((skill) => ids.has(String(skill.id))).map((skill) => skill.titre);
}

function mapRow(row: Record<string, unknown>, cursusByAlias: Map<string, string>): PublicOffer {
  const description = text(row.description);
  const split = splitMissions(description);
  const diploma = text(row.diploma_prepared);
  const cursusId = cursusByAlias.get(diploma.toLowerCase()) ?? "";
  const hours = Number(row.hours_per_week);
  return {
    slug: text(row.slug),
    title: text(row.title) || "Offre",
    sector: text(row.sector) || "Secteur non précisé",
    sizeLabel: text(row.size_label) || "Taille non précisée",
    city: text(row.city),
    contractType: text(row.contract_type),
    duration: text(row.contract_duration),
    startLabel: text(row.start_label),
    workMode: text(row.work_mode),
    hours: Number.isFinite(hours) && hours > 0 ? `${hours} h / semaine` : "",
    payLabel: text(row.pay_label),
    benefits: labels(row.benefits),
    description: split.description,
    missions: split.missions,
    skills: labels(row.skills).slice(0, 8),
    softSkills: softSkills(row.soft_skill_ids),
    steps: stepsOf(row.recruitment_steps),
    cursus: cursusId ? getCfaSpecializationLabel(cursusId) : diploma,
    publishedAt: text(row.published_at),
  };
}

async function cursusMap(db: SupabaseClient) {
  const map = new Map<string, string>();
  const aliases = await db.from("cursus_aliases").select("alias, cursus_id");
  if (aliases.error) return map;
  for (const row of aliases.data ?? []) {
    const item = row as { alias?: string | null; cursus_id?: string | null };
    const alias = text(item.alias).toLowerCase();
    if (alias) map.set(alias, text(item.cursus_id));
  }
  return map;
}

export async function listPublicOffers(db: SupabaseClient): Promise<PublicOffer[]> {
  const [rows, aliases] = await Promise.all([
    db.from("public_job_offers").select(COLUMNS).order("published_at", { ascending: false }).limit(60),
    cursusMap(db),
  ]);
  if (rows.error || !rows.data) return [];
  return (rows.data as Record<string, unknown>[]).map((row) => mapRow(row, aliases)).filter((offer) => offer.slug);
}

export async function getPublicOffer(db: SupabaseClient, slug: string): Promise<PublicOffer | null> {
  const [row, aliases] = await Promise.all([
    db.from("public_job_offers").select(COLUMNS).eq("slug", slug).maybeSingle(),
    cursusMap(db),
  ]);
  if (row.error || !row.data) return null;
  const offer = mapRow(row.data as Record<string, unknown>, aliases);
  return offer.slug ? offer : null;
}

export function publishedLabel(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "il y a 1 jour";
  if (days < 14) return `il y a ${days} jours`;
  if (days < 45) return `il y a ${Math.max(1, Math.round(days / 7))} sem.`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(then));
}

export function alternancePay(contractType: string, salary: string) {
  return /alternance|apprentissage/i.test(contractType) ? "Selon l'âge et l'année du contrat" : salary;
}
