import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  contributorDisplayName,
  parseContributorProfile,
  type ContributorRole,
} from "@/lib/expert/contributor-profile";

export type ProgramContributor = {
  id: string;
  name: string;
  jobTitle: string;
  photoUrl: string | null;
  companyLogoUrl: string | null;
  roles: ContributorRole[];
};

export async function getProgramContributors(cursusLabel: string): Promise<ProgramContributor[]> {
  const db = getServiceRoleClient();
  if (!db || !cursusLabel.trim()) return [];

  const { data, error } = await db
    .from("experts")
    .select("id,first_name,last_name,headline,photo_url,avatar_url,specialties,references,review_status,is_active")
    .eq("is_active", true)
    .limit(500);

  if (error || !data) return [];

  return data.flatMap((row) => {
    const profile = parseContributorProfile(row.references, row.headline);
    const specialties = Array.isArray(row.specialties) ? row.specialties.map((item) => String(item)) : [];
    const name = contributorDisplayName(row.first_name, row.last_name);
    if (!name || profile.roles.length === 0 || !specialties.includes(cursusLabel)) return [];
    return [{
      id: String(row.id),
      name,
      jobTitle: profile.jobTitle,
      photoUrl: row.photo_url || row.avatar_url || null,
      companyLogoUrl: profile.companyLogoUrl,
      roles: profile.roles,
    }];
  });
}

export type HomepageExpert = {
  id: string;
  name: string;
  jobTitle: string;
  photoUrl: string;
  filiere: string;
  order: number | null;
};

function filiereOf(specialties: unknown): string {
  const labels = Array.isArray(specialties) ? specialties.map((item) => String(item).trim()).filter(Boolean) : [];
  const first = labels[0] ?? "";
  if (first === "Business Sport") return "Sport Business";
  return first;
}

function asHomepageExpert(row: {
  id: unknown;
  first_name?: string | null;
  last_name?: string | null;
  headline?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  specialties?: unknown;
  references?: unknown;
  show_on_homepage?: boolean | null;
  homepage_order?: number | null;
}, useColumn: boolean): HomepageExpert | null {
  const profile = parseContributorProfile(row.references, row.headline);
  const visible = useColumn ? row.show_on_homepage === true : profile.showOnHomepage;
  const photoUrl = row.photo_url || row.avatar_url || "";
  const name = contributorDisplayName(row.first_name, row.last_name);
  if (!visible || !photoUrl || !name) return null;
  const order = useColumn && row.homepage_order != null ? Number(row.homepage_order) : profile.homepageOrder;
  return {
    id: String(row.id),
    name,
    jobTitle: profile.jobTitle,
    photoUrl,
    filiere: filiereOf(row.specialties),
    order: Number.isFinite(Number(order)) ? Number(order) : null,
  };
}

/** Experts cochés « Visible en page d'accueil » et pourvus d'une photo. */
export async function getHomepageExperts(): Promise<HomepageExpert[]> {
  const db = getServiceRoleClient();
  if (!db) return [];

  const columns = "id,first_name,last_name,headline,photo_url,avatar_url,specialties,references,show_on_homepage,homepage_order";
  const full = await db.from("experts").select(columns).eq("is_active", true);
  let rows = full.data ?? [];
  let useColumn = !full.error;
  if (full.error) {
    const fallback = await db
      .from("experts")
      .select("id,first_name,last_name,headline,photo_url,avatar_url,specialties,references")
      .eq("is_active", true);
    if (fallback.error || !fallback.data) return [];
    rows = fallback.data;
    useColumn = false;
  }

  return rows
    .map((row) => asHomepageExpert(row, useColumn))
    .filter((person): person is HomepageExpert => Boolean(person))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name, "fr"));
}

export async function getContributorByLastName(lastName: string): Promise<ProgramContributor | null> {
  const db = getServiceRoleClient();
  const needle = lastName.trim();
  if (!db || !needle) return null;

  const { data, error } = await db
    .from("experts")
    .select("id,first_name,last_name,headline,photo_url,avatar_url,references,is_active")
    .ilike("last_name", needle)
    .limit(5);

  if (error || !data?.length) return null;
  const row = data.find((item) => item.is_active !== false) ?? data[0];
  const profile = parseContributorProfile(row.references, row.headline);
  const name = contributorDisplayName(row.first_name, row.last_name);
  if (!name) return null;
  return {
    id: String(row.id),
    name,
    jobTitle: profile.jobTitle,
    photoUrl: row.photo_url || row.avatar_url || null,
    companyLogoUrl: profile.companyLogoUrl,
    roles: profile.roles,
  };
}
