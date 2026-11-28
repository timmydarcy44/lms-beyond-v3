import type { Metadata } from "next";
import { loadCareProspects } from "@/lib/control/care-prospects";
import { CareProspectsClient } from "./care-prospects-client";

export const metadata: Metadata = {
  title: "Prospects Care | Byound Control",
};

export const dynamic = "force-dynamic";

export default async function SuperCareProspectsPage() {
  const prospects = await loadCareProspects();
  return <CareProspectsClient prospects={prospects} />;
}
