import { Metadata } from "next";
import { BeyondNoSchoolPage } from "@/components/beyond-no-school/beyond-no-school-page";

export const metadata: Metadata = {
  title: "Beyond No School - Formations en ligne | Beyond",
  description: "Développez vos compétences avec Beyond No School. Catalogue complet de formations interactives adaptées à tous les niveaux.",
};

export default function NoSchoolPage() {
  return <BeyondNoSchoolPage />;
}

