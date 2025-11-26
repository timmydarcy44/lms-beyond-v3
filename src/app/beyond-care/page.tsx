import { Metadata } from "next";
import { BeyondCarePage } from "@/components/beyond-care/beyond-care-page";

export const metadata: Metadata = {
  title: "Beyond Care - Santé mentale et bien-être | Beyond",
  description: "Questionnaire propriétaire d'état mental naturel, questionnaire hebdomadaire, suivi analytique, conseils et psychopédagogie pour votre bien-être mental.",
};

export default function CarePage() {
  return <BeyondCarePage />;
}

