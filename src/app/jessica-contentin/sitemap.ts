import type { MetadataRoute } from "next";
import { buildJessicaContentinSitemap } from "@/lib/seo/jessica-contentin-sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildJessicaContentinSitemap();
}
