import type { Metadata } from "next";

import { EntreprisesPageContent } from "@/components/edge-site/entreprises-page-content";

export const metadata: Metadata = {
  title: "Entreprises — Former autrement | EDGE",
  description:
    "Diagnostic comportemental, parcours sur-mesure et pilotage de la performance. Pour les entreprises qui ne veulent pas faire semblant de former.",
};

export default function EntreprisesPage() {
  return <EntreprisesPageContent />;
}
