import type { Metadata } from "next";

import { EdgeDiagnosticsPage } from "@/components/edge-site/business/diagnostics/edge-diagnostics-page";

export const metadata: Metadata = {
  title: "Diagnostics de compétences — EDGE Business",
  description:
    "Évaluez Soft Skills, IDMC (Indice de Maîtrise Cognitive) et psychologie comportementale inspirée du DISC. Mesurez objectivement avant de développer et certifier les talents.",
};

export default function Page() {
  return <EdgeDiagnosticsPage />;
}
