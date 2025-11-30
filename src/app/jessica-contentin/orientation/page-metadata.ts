import { Metadata } from "next";
import { PAGE_SEO_CONFIG } from "@/lib/seo/jessica-contentin-seo";

export const metadata: Metadata = {
  title: PAGE_SEO_CONFIG.orientation.title,
  description: PAGE_SEO_CONFIG.orientation.description,
  keywords: PAGE_SEO_CONFIG.orientation.keywords.join(", "),
  metadataBase: new URL("https://jessicacontentin.fr"),
  openGraph: {
    title: PAGE_SEO_CONFIG.orientation.title,
    description: PAGE_SEO_CONFIG.orientation.description,
    url: PAGE_SEO_CONFIG.orientation.canonical,
    siteName: "Jessica CONTENTIN - Psychopédagogue",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_SEO_CONFIG.orientation.title,
    description: PAGE_SEO_CONFIG.orientation.description,
  },
  alternates: {
    canonical: PAGE_SEO_CONFIG.orientation.canonical,
  },
};

