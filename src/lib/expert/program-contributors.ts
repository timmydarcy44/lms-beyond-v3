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
