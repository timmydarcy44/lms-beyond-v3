import type { MetadataRoute } from "next";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { byoundSeoCatalog, loadSeoOverrides } from "@/lib/seo/byound-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const overrides = await loadSeoOverrides();
  return byoundSeoCatalog()
    .filter((item) => overrides.get(item.path)?.noindex !== true)
    .map((item) => ({
      url: `${BYOUND_PUBLIC_ORIGIN}${item.path === "/" ? "/" : item.path}`,
      lastModified: overrides.get(item.path)?.updated_at ? new Date(String(overrides.get(item.path)?.updated_at)) : new Date(),
      changeFrequency: item.path === "/" ? "weekly" : "monthly",
      priority: item.path === "/" ? 1 : 0.7,
    }));
}
