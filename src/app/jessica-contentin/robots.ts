import type { MetadataRoute } from "next";
import { JESSICA_SITEMAP_BASE_URL } from "@/lib/seo/jessica-contentin-sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/inscription",
        "/mon-compte",
        "/panier",
        "/confirmer",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${JESSICA_SITEMAP_BASE_URL}/sitemap.xml`,
  };
}
