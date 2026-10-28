import type { MetadataRoute } from "next";
import { CARE_PUBLIC_ORIGIN } from "@/lib/care/host";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/reserver/", "/reservation/", "/dashboard/", "/login", "/api/"],
      },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
    ],
    sitemap: `${CARE_PUBLIC_ORIGIN}/sitemap.xml`,
    host: CARE_PUBLIC_ORIGIN,
  };
}
