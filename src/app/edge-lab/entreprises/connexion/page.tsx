import type { Metadata } from "next";

import { EntrepriseConnexionPage } from "@/components/edge-site/entreprise-connexion-page";

export const metadata: Metadata = {
  title: "Connexion entreprise — Essai 30 jours | Byound",
  description:
    "Créez votre espace RH Byound : essai gratuit 30 jours, diagnostics équipe et dashboard entreprise.",
};

export default function EntrepriseConnexionRoutePage() {
  return <EntrepriseConnexionPage />;
}
