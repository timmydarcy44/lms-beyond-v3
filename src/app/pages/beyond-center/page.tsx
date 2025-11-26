import { Metadata } from "next";
import { BeyondCenterLandingPage } from "@/components/beyond-center/beyond-center-landing-page";

export const metadata: Metadata = {
  title: "Beyond Center - Centre de formation et développement des compétences",
  description: "Développez vos compétences, certifiez-vous avec des Open Badge et obtenez des certifications ministère du travail. Écosystème complet de développement professionnel et personnel.",
};

export default function BeyondCenterLandingPageRoute() {
  return <BeyondCenterLandingPage />;
}
