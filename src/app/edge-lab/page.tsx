import type { Metadata } from "next";

import { EdgePremiumHome } from "@/components/edge-site/premium/edge-premium-home";

export const metadata: Metadata = {
  title: "EDGE — Développons les compétences qui feront la différence demain",
  description:
    "EDGE accompagne les apprenants et les organisations avec des formations innovantes, une technologie intelligente et une pédagogie orientée résultats.",
  openGraph: {
    title: "EDGE — Formation & développement des compétences",
    description:
      "Formations, alternance, certifications et solutions entreprise. +25 000 apprenants, 500+ organisations partenaires.",
    type: "website",
  },
};

export default function EdgeHomePage() {
  return <EdgePremiumHome />;
}
