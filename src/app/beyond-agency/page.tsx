import type { Metadata } from "next";

import { BeyondAgencyHome } from "@/components/beyond-center/agency/beyond-agency-home";

export const metadata: Metadata = {
  title: "Beyond — Optimisation de la performance commerciale",
  description:
    "CRM, pipeline, automatisation et IA pour accélérer la conversion et le pilotage commercial.",
};

export default function BeyondAgencyPreviewPage() {
  return <BeyondAgencyHome />;
}
