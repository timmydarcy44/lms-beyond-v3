import { Metadata } from "next";
import { BeyondCarePage } from "@/components/landing/beyond-care-page";

export const metadata: Metadata = {
  title: "Beyond Care - Suivi de santé mentale | Beyond LMS",
  description: "Agissez sur la santé mentale de vos apprenants avec Beyond Care. Questionnaires intelligents, analyse des tendances et alertes préventives.",
};

export default function BeyondCarePageRoute() {
  return <BeyondCarePage />;
}







