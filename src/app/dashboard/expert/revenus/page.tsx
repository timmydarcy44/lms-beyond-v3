import { RevenusView } from "@/components/expert/space/revenus-view";
import { monthKey } from "@/lib/expert/space-model";
import { loadExpertSpace } from "@/lib/expert/space-server";

export const dynamic = "force-dynamic";

export default async function ExpertRevenusPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; facture?: string }>;
}) {
  const params = await searchParams;
  const space = await loadExpertSpace();
  return <RevenusView missions={space.missions} month={params.m || monthKey(new Date())} invoiceId={params.facture} />;
}
