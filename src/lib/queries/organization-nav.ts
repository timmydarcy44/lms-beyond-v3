import { headers } from "next/headers";

import { getServerClient } from "@/lib/supabase/server";

/** Logo public Playmakers (aligné Hero / nav). */
export const PLAYMAKERS_BRANDING_LOGO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Playmakers/Copie%20de%20Jessica%20Contention%20(1).png";

export type OrganizationNavBranding = {
  logoUrl: string | null;
  name: string | null;
};

/**
 * Branding sidebar : priorité URL galaxie (`x-org-slug`), sinon première appartenance org (option filtre rôle).
 * `logoUrl` préfère `organizations.logo_url` puis `logo`.
 */
export async function getOrganizationNavBrandingForUser(options?: {
  membershipRole?: "admin" | "learner" | "instructor" | null;
  slug?: string | null;
}): Promise<OrganizationNavBranding> {
  const supabase = await getServerClient();
  if (!supabase) {
    return { logoUrl: null, name: null };
  }

  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) {
      return { logoUrl: null, name: null };
    }

    const h = await headers();
    const slug = String(options?.slug ?? (h.get("x-org-slug") ?? "")).trim();
    const slugLower = slug.toLowerCase();

    let orgId: string | null = null;

    if (slug) {
      const { data: bySlug } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      orgId = String((bySlug as { id?: string } | null)?.id ?? "").trim() || null;
    }

    if (!orgId) {
      let q = supabase.from("org_memberships").select("org_id").eq("user_id", userId);
      if (options?.membershipRole) {
        q = q.eq("role", options.membershipRole);
      }
      const { data: row } = await q.limit(1).maybeSingle();
      orgId = String((row as { org_id?: string } | null)?.org_id ?? "").trim() || null;
    }

    if (!orgId) {
      return { logoUrl: null, name: null };
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("name, logo_url, logo")
      .eq("id", orgId)
      .maybeSingle();

    const o = org as { name?: string; logo_url?: string; logo?: string } | null;
    const fromUrl = String(o?.logo_url ?? "").trim();
    const fromLegacy = String(o?.logo ?? "").trim();
    const logoUrl = slugLower === "playmakers" ? PLAYMAKERS_BRANDING_LOGO_URL : fromUrl || fromLegacy || null;
    const name = String(o?.name ?? "").trim() || null;

    return { logoUrl, name };
  } catch (e) {
    console.error("[organization-nav] branding error:", e);
    return { logoUrl: null, name: null };
  }
}
