import type { Metadata } from "next";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80";

const slugToDisplayName = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part, idx, arr) =>
      idx === arr.length - 1
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(" ")
    .trim();

const absoluteUrl = (path: string) => `https://getbeyond.fr${path}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const resolvedParams =
    typeof (params as { then?: unknown }).then === "function"
      ? await (params as Promise<{ slug: string }>)
      : (params as { slug: string });

  const slug = resolvedParams.slug;
  const fallbackName = slugToDisplayName(slug) || "Profil Beyond";
  let displayName = fallbackName;
  let displayTitle = "Profil Beyond";
  let imageUrl = DEFAULT_COVER;

  const supabase = await getServiceRoleClientOrFallback();
  if (supabase) {
    try {
      let resolvedUserId: string | null = null;

      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

      if (isUuid) {
        resolvedUserId = slug;
      } else {
        const { data: settingsData } = await supabase
          .from("user_profile_settings")
          .select("user_id")
          .eq("public_slug", slug)
          .maybeSingle();
        resolvedUserId = settingsData?.user_id ?? null;
      }

      if (resolvedUserId) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("first_name, last_name, full_name, type_profil, avatar_url")
          .eq("id", resolvedUserId)
          .maybeSingle();

        if (profileData) {
          const first = String(profileData.first_name ?? "").trim();
          const last = String(profileData.last_name ?? "").trim();
          const fullName = String(profileData.full_name ?? "").trim();
          displayName = `${first} ${last.toUpperCase()}`.trim() || fullName || fallbackName;
          const rawType = String(profileData.type_profil ?? "").trim().toLowerCase();
          const typeMap: Record<string, string> = {
            alternance: "Profil en alternance",
            freelance: "Profil freelance",
            emploi: "Profil en poste",
            reconversion: "Profil en reconversion",
          };
          const rawTypeLabel = String(profileData.type_profil ?? "").trim();
          displayTitle = typeMap[rawType] || rawTypeLabel || "Profil Beyond";
          if (profileData.avatar_url) {
            imageUrl = String(profileData.avatar_url);
          }
        }
      }
    } catch {
      // Fallback metadata is enough when DB lookup fails
    }
  }

  const title = `${displayName} | Profil Beyond`;
  const description = `${displayTitle} - Profil public certifie Beyond`;
  const canonicalPath = `/p/${slug}`;
  const canonicalUrl = absoluteUrl(canonicalPath);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: canonicalUrl,
      siteName: "Beyond",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function PublicProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

