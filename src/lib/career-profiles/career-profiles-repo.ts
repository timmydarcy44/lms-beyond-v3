import {
  CAREER_PROFILES,
  type CareerProfile,
} from "@/lib/career-profiles/career-profiles-data";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export type CareerProfileSource = "db" | "static";

export type CareerProfileRecord = CareerProfile & {
  source: CareerProfileSource;
  is_active?: boolean;
};

type DbCareerRow = {
  id: string;
  slug: string;
  title: string;
  sector: string;
  description: string;
  key_skills: unknown;
  soft_skills: unknown;
  behavioral_expectations: unknown;
  recommended_badges: unknown;
  typical_challenges: unknown;
  success_factors: unknown;
  main_missions: unknown;
  useful_qualities: unknown;
  recommended_formations: unknown;
  is_active?: boolean;
};

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((s) => s.trim()).filter(Boolean);
}

export function mapDbRowToCareerProfile(row: DbCareerRow): CareerProfileRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    sector: row.sector,
    description: row.description,
    key_skills: parseStringArray(row.key_skills),
    soft_skills: parseStringArray(row.soft_skills),
    behavioral_expectations: parseStringArray(row.behavioral_expectations),
    recommended_badges: parseStringArray(row.recommended_badges),
    typical_challenges: parseStringArray(row.typical_challenges),
    success_factors: parseStringArray(row.success_factors),
    main_missions: parseStringArray(row.main_missions),
    useful_qualities: parseStringArray(row.useful_qualities),
    recommended_formations: parseStringArray(row.recommended_formations),
    source: "db",
    is_active: row.is_active ?? true,
  };
}

export async function fetchCareerProfilesFromDb(): Promise<CareerProfileRecord[]> {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("career_profiles")
    .select("*")
    .eq("is_active", true)
    .order("title", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapDbRowToCareerProfile(row as DbCareerRow));
}

export async function fetchAllCareerProfilesFromDb(): Promise<CareerProfileRecord[]> {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("career_profiles")
    .select("*")
    .order("title", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapDbRowToCareerProfile(row as DbCareerRow));
}

export function mergeCareerProfiles(dbProfiles: CareerProfileRecord[]): CareerProfileRecord[] {
  const dbSlugs = new Set(dbProfiles.map((p) => p.slug));
  const staticProfiles: CareerProfileRecord[] = CAREER_PROFILES.filter((p) => !dbSlugs.has(p.slug)).map(
    (p) => ({ ...p, source: "static" as const, is_active: true }),
  );
  return [...dbProfiles, ...staticProfiles].sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

export async function listCareerProfiles(): Promise<CareerProfileRecord[]> {
  const dbProfiles = await fetchCareerProfilesFromDb();
  return mergeCareerProfiles(dbProfiles);
}

export async function listAllCareerProfilesAdmin(): Promise<CareerProfileRecord[]> {
  const dbProfiles = await fetchAllCareerProfilesFromDb();
  return mergeCareerProfiles(dbProfiles);
}

export async function getCareerProfileBySlug(slug: string): Promise<CareerProfileRecord | undefined> {
  const supabase = await getServiceRoleClientOrFallback();
  if (supabase) {
    const { data } = await supabase
      .from("career_profiles")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (data) return mapDbRowToCareerProfile(data as DbCareerRow);
  }

  const staticProfile = CAREER_PROFILES.find((p) => p.slug === slug);
  if (!staticProfile) return undefined;
  return { ...staticProfile, source: "static", is_active: true };
}

export function searchCareerProfilesLocal(
  profiles: CareerProfileRecord[],
  query: string,
  limit = 12,
): CareerProfileRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return profiles.slice(0, limit);
  return profiles
    .filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.sector.toLowerCase().includes(q) ||
        p.slug.includes(q),
    )
    .slice(0, limit);
}

export function slugifyCareerTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
