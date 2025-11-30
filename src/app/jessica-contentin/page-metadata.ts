import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/jessica-contentin-seo";

export const metadata: Metadata = {
  ...generateSEOMetadata("home"),
  metadataBase: new URL("https://jessicacontentin.fr"),
};

