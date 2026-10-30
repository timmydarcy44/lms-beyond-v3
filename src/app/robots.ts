import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { BYOUND_PUBLIC_ORIGIN, isByoundMarketingHost } from "@/lib/edge-site/byound-host";

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!isByoundMarketingHost((await headers()).get("host"))) {
    return { rules: { userAgent: "*", allow: "/" } };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/super/", "/api/", "/login"] },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: `${BYOUND_PUBLIC_ORIGIN}/sitemap.xml`,
    host: BYOUND_PUBLIC_ORIGIN,
  };
}
