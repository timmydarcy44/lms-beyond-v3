import type { MetadataRoute } from "next";
import { CARE_PUBLIC_ORIGIN } from "@/lib/care/host";
import { loadPublishedCareSlugs } from "@/lib/care/profile";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await loadPublishedCareSlugs();
  const now = new Date();
  return [
    { url: `${CARE_PUBLIC_ORIGIN}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${CARE_PUBLIC_ORIGIN}/praticiens`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...slugs.map((slug) => ({
      url: `${CARE_PUBLIC_ORIGIN}/praticiens/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
