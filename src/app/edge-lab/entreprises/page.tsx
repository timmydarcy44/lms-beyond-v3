import type { Metadata } from "next";

import { EntreprisesPageContent } from "@/components/edge-site/entreprises-page-content";

export const metadata: Metadata = {
  title: "Entreprises — Former autrement | EDGE",
  description:
    "On diagnostique avant de former. On mesure après. Diagnostic Beyond, licences plateforme et interventions sur-mesure pour vos équipes.",
};

export default function EntreprisesPage() {
  return <EntreprisesPageContent />;
}
