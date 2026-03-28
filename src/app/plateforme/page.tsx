import type { Metadata } from "next";
import { BeyondCenterPlateformePage } from "@/components/beyond-center/beyond-center-marketing-inner";

export const metadata: Metadata = {
  title: "Plateforme | Beyond Center",
  description:
    "Le système Beyond : expérience utilisateur, parcours personnalisés, Nevo et suivi de la progression dans le temps.",
};

export default function PlateformePage() {
  return <BeyondCenterPlateformePage />;
}
