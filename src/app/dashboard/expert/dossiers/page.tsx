import { requireCarePage } from "@/lib/expert/care-page";
import { CareCrmBoard } from "@/components/expert/care-crm-board";

export const dynamic = "force-dynamic";

export default async function ExpertCareCrmPage() {
  await requireCarePage();
  return <CareCrmBoard mode="crm" />;
}
