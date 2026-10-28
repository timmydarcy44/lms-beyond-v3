import type { Metadata } from "next";
import { CARE_PUBLIC_ORIGIN, careAbsoluteUrl } from "@/lib/care/host";
import { CARE_DIRECTORY_COPY } from "@/lib/care/directory-copy";
import { CARE_HOME } from "@/lib/care/home-copy";

export const CARE_SEO = {
  siteName: "Byound Care",
  homeTitle: "Comprendre comment vous fonctionnez",
  homeDescription: CARE_HOME.hero.particuliers.lead,
  directoryTitle: CARE_DIRECTORY_COPY.title.replace(/\.$/, ""),
  directoryDescription: CARE_DIRECTORY_COPY.lead,
} as const;

export function carePageMetadata(input: {
  title: string;
  description: string;
  internalPath: string;
  index?: boolean;
}): Metadata {
  const canonical = careAbsoluteUrl(input.internalPath);
  const index = input.index !== false;
  return {
    metadataBase: new URL(CARE_PUBLIC_ORIGIN),
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: canonical,
      siteName: CARE_SEO.siteName,
      title: `${input.title} · ${CARE_SEO.siteName}`,
      description: input.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} · ${CARE_SEO.siteName}`,
      description: input.description,
    },
  };
}

export function careHomeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Byound Care",
        url: CARE_PUBLIC_ORIGIN,
        description: CARE_SEO.homeDescription,
        parentOrganization: { "@type": "Organization", name: "Byound", url: "https://www.byound.fr" },
      },
      {
        "@type": "WebSite",
        name: "Byound Care",
        url: CARE_PUBLIC_ORIGIN,
        inLanguage: "fr-FR",
        potentialAction: {
          "@type": "SearchAction",
          target: `${CARE_PUBLIC_ORIGIN}/praticiens?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}
