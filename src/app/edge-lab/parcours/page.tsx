import type { Metadata } from "next";

import { ParcoursCatalogPage } from "@/components/edge-site/parcours-catalog-page";

export const metadata: Metadata = {
  title: "Tous les parcours EDGE — Parcours certifiants",
  description:
    "14 parcours professionnels certifiants. Open Badge IMS Global. Performance, leadership, humain, innovation.",
};

export default function ParcoursIndexPage() {
  return <ParcoursCatalogPage />;
}
