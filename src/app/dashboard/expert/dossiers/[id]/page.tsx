import { requireCarePage } from "@/lib/expert/care-page";
import { CareClientFiche } from "@/components/expert/care-client-fiche";

export const dynamic = "force-dynamic";

export default async function ExpertCareClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCarePage();
  const { id } = await params;
  return <CareClientFiche clientId={id} />;
}
