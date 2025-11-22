import { Metadata } from "next";
import { BeyondConnectJobsPageContent } from "@/components/beyond-connect/jobs-page";

export const metadata: Metadata = {
  title: "Offres d'emploi - Beyond Connect",
  description: "Découvrez les offres d'emploi, stages et alternances disponibles",
};

export default function BeyondConnectJobsPage() {
  return <BeyondConnectJobsPageContent />;
}

