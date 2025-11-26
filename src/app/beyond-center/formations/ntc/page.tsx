import { Metadata } from "next";
import { NTCPresentationPage } from "@/components/beyond-center/ntc-presentation-page";

export const metadata: Metadata = {
  title: "Titre Professionnel NTC - Négociateur Technico-Commercial | Beyond Center",
  description: "Formez-vous au titre professionnel NTC (Négociateur Technico-Commercial), niveau 4. Formation certifiante en alternance ou continue. Développez vos compétences commerciales et techniques.",
};

export default function NTCPage() {
  return <NTCPresentationPage />;
}

