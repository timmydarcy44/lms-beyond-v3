import { Metadata } from "next";
import { BeyondCenterPresentationPage } from "@/components/beyond-center/beyond-center-presentation-page";

export const metadata: Metadata = {
  title: "Beyond Center - Présentation | Centre de formation",
  description: "Découvrez Beyond Center, votre centre de formation pour développer vos compétences et obtenir des certifications reconnues.",
};

export default function BeyondCenterPresentationRoute() {
  return <BeyondCenterPresentationPage />;
}

