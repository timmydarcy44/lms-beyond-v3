import type { Metadata } from "next";

import { TarifsPageContent } from "@/components/edge-site/tarifs-page-content";

export const metadata: Metadata = {
  title: "Tarifs — Transparent et sur-mesure | EDGE",
  description:
    "Calculez le coût exact pour votre équipe. Formules Essentiel, Performance et Sur-Mesure. Add-ons et simulateur en temps réel.",
};

export default function TarifsPage() {
  return <TarifsPageContent />;
}
