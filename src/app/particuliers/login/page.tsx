import type { Metadata } from "next";

import { ParticulierLoginPage } from "@/components/edge-site/particulier-login-page";

export const metadata: Metadata = {
  title: "Connexion — Espace particulier | Byound",
  description: "Connectez-vous à votre espace compétences Byound : tests DISC, IDMC et profil public.",
};

export default function ParticuliersLoginRoutePage() {
  return <ParticulierLoginPage />;
}
