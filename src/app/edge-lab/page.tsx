import type { Metadata } from "next";

import { EdgePremiumHome } from "@/components/edge-site/premium/edge-premium-home";

export const metadata: Metadata = {
  title: "EDGE — Développons les compétences qui feront la différence demain",
  description:
    "Parce que les organismes de formation doivent évoluer. Identifier, former et valoriser les compétences — avec des résultats mesurables.",
  openGraph: {
    title: "EDGE — Formation & développement des compétences",
    description:
      "Identifications. Formations. Valorisations des compétences. +25 000 personnes formées, 500+ organisations partenaires.",
    type: "website",
  },
};

export default function EdgeHomePage() {
  return <EdgePremiumHome />;
}
