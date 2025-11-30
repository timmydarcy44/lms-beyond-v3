import { Metadata } from "next";
import { PAGE_SEO_CONFIG } from "@/lib/seo/jessica-contentin-seo";

export const metadata: Metadata = {
  title: PAGE_SEO_CONFIG.consultations.title,
  description: PAGE_SEO_CONFIG.consultations.description,
  keywords: PAGE_SEO_CONFIG.consultations.keywords.join(", "),
  metadataBase: new URL("https://jessicacontentin.fr"),
  openGraph: {
    title: PAGE_SEO_CONFIG.consultations.title,
    description: PAGE_SEO_CONFIG.consultations.description,
    url: PAGE_SEO_CONFIG.consultations.canonical,
    siteName: "Jessica CONTENTIN - Psychopédagogue",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_SEO_CONFIG.consultations.title,
    description: PAGE_SEO_CONFIG.consultations.description,
  },
  alternates: {
    canonical: PAGE_SEO_CONFIG.consultations.canonical,
  },
};

export default function ConsultationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

