import { Metadata } from "next";
import { SPECIALITY_SEO_CONFIG } from "@/lib/seo/link-juice-strategy";

export function generateSpecialityMetadata(slug: string): Metadata {
  const seoConfig = SPECIALITY_SEO_CONFIG[slug];
  
  if (!seoConfig) {
    // Métadonnées par défaut si pas de config spécifique
    return {
      title: `Spécialité - Jessica CONTENTIN | Psychopédagogue Caen`,
      description: "Accompagnement psychopédagogique personnalisé à Caen. Cabinet Jessica CONTENTIN, Fleury-sur-Orne.",
      metadataBase: new URL("https://jessicacontentin.fr"),
    };
  }

  return {
    title: seoConfig.title,
    description: seoConfig.description,
    keywords: seoConfig.keywords.join(", "),
    metadataBase: new URL("https://jessicacontentin.fr"),
    openGraph: {
      title: seoConfig.title,
      description: seoConfig.description,
      url: `https://jessicacontentin.fr/specialites/${slug}`,
      siteName: "Jessica CONTENTIN - Psychopédagogue",
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seoConfig.title,
      description: seoConfig.description,
    },
    alternates: {
      canonical: `https://jessicacontentin.fr/specialites/${slug}`,
    },
  };
}

