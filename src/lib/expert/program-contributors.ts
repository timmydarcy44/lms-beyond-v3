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
  roles: ContributorRole[];
};

export async function getProgramContributors(cursusLabel: string): Promise<ProgramContributor[]> {
  const db = getServiceRoleClient();
  if (!db || !cursusLabel.trim()) return [];

  const { data, error } = await db
    .from("experts")
    .select("id,first_name,last_name,headline,photo_url,avatar_url,specialties,references,review_status,is_active")
    .eq("review_status", "approved")
    .eq("is_active", true)
    .contains("specialties", [cursusLabel]);

  if (error || !data) return [];

  return data
    .map((row) => {
      const profile = parseContributorProfile(row.references, row.headline);
      return {
        id: String(row.id),
        name: contributorDisplayName(row.first_name, row.last_name),
        jobTitle: profile.jobTitle,
        photoUrl: row.photo_url || row.avatar_url || null,
        roles: profile.roles,
      };
    })
    .filter((person) => person.name);
}
