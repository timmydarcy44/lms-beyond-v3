import { DocumentsView } from "@/components/expert/space/documents-view";
import { loadExpertSpace } from "@/lib/expert/space-server";

export const dynamic = "force-dynamic";

export default async function ExpertDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const params = await searchParams;
  const space = await loadExpertSpace();
  return <DocumentsView documents={space.documents} folder={params.folder || "tous"} />;
}
