import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import { generateCareerProfileWithAi, careerTitlesMatch } from "@/lib/career-profiles/generate-career-profile-ai";
import {
  getCareerProfileBySlug,
  listCareerProfiles,
  mapDbRowToCareerProfile,
  slugifyCareerTitle,
  type CareerProfileRecord,
} from "@/lib/career-profiles/career-profiles-repo";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export type ResolveCareerProfileResult = {
  profile: CareerProfileRecord;
  cached: boolean;
};

async function findCareerByTitle(title: string): Promise<CareerProfileRecord | undefined> {
  const profiles = await listCareerProfiles();
  const norm = title.trim();
  return profiles.find(
    (p) => careerTitlesMatch(p.title, norm) || slugifyCareerTitle(p.title) === slugifyCareerTitle(norm),
  );
}

export async function saveCareerProfileToDb(profile: CareerProfile): Promise<CareerProfileRecord | null> {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) return null;

  const slug = profile.slug || slugifyCareerTitle(profile.title);
  const now = new Date().toISOString();

  const row = {
    id: slug,
    slug,
    title: profile.title.trim(),
    sector: profile.sector.trim() || "Autre",
    description: profile.description.trim(),
    key_skills: profile.key_skills,
    soft_skills: profile.soft_skills,
    behavioral_expectations: profile.behavioral_expectations,
    recommended_badges: profile.recommended_badges,
    typical_challenges: profile.typical_challenges,
    success_factors: profile.success_factors,
    main_missions: profile.main_missions,
    useful_qualities: profile.useful_qualities,
    recommended_formations: profile.recommended_formations,
    is_active: true,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("career_profiles")
    .upsert(row, { onConflict: "slug" })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapDbRowToCareerProfile(data);
}

/** Résout une fiche métier : cache (base + statique) ou génération IA + sauvegarde. */
export async function resolveCareerProfile(input: {
  title?: string;
  slug?: string;
}): Promise<ResolveCareerProfileResult | null> {
  const rawTitle = String(input.title ?? "").trim();
  const rawSlug = String(input.slug ?? "").trim();
  const slug = rawSlug || (rawTitle ? slugifyCareerTitle(rawTitle) : "");

  if (!slug && !rawTitle) return null;

  if (slug) {
    const bySlug = await getCareerProfileBySlug(slug);
    if (bySlug) return { profile: bySlug, cached: true };
  }

  if (rawTitle) {
    const byTitle = await findCareerByTitle(rawTitle);
    if (byTitle) return { profile: byTitle, cached: true };
  }

  const titleForAi = rawTitle || slug.replace(/-/g, " ");
  const generated = await generateCareerProfileWithAi({ title: titleForAi });
  if (!generated) return null;

  const saved = await saveCareerProfileToDb(generated);
  if (saved) return { profile: saved, cached: false };

  return {
    profile: { ...generated, source: "db", is_active: true },
    cached: false,
  };
}
