import type { Metadata } from "next";

import { EdgeDiagnosticsPage } from "@/components/edge-site/business/diagnostics/edge-diagnostics-page";

export const metadata: Metadata = {
  title: "Diagnostics de compétences — EDGE Business",
  description:
    "Plus de 40 diagnostics scientifiques pour mesurer les compétences cognitives, comportementales, émotionnelles et managériales, puis personnaliser les parcours de développement.",
};

export default function Page() {
  return <EdgeDiagnosticsPage />;
}
