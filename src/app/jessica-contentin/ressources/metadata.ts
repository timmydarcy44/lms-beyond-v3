import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/jessica-contentin-seo";

export const metadata: Metadata = {
  ...generateSEOMetadata("ressources"),
  metadataBase: new URL("https://jessicacontentin.fr"),
  // Note: Rayonnement national pour les ressources (pas de géolocalisation)
};

