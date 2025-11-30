import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/jessica-contentin-seo";

export const metadata: Metadata = {
  ...generateSEOMetadata("a-propos"),
  metadataBase: new URL("https://jessicacontentin.fr"),
};

