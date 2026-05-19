import type { Metadata } from "next";

import { CommercialIaNarrativePage } from "@/components/edge-site/commercial-ia-narrative-page";

export const metadata: Metadata = {
  title: "Commercial Augmenté par l'IA — Parcours certifiant EDGE",
  description:
    "45h · Open Badge IMS Global. Prospecter, convaincre et conclure avec l'IA — sans perdre l'humain.",
};

export default function CommercialIaParcoursPage() {
  return <CommercialIaNarrativePage />;
}
