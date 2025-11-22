import { Metadata } from "next";
import { BeyondNoteDocumentPage } from "@/components/beyond-note/beyond-note-document-page";

export const metadata: Metadata = {
  title: "Beyond Note - Document",
  description: "Visualisez et transformez votre document avec l'IA",
};

type PageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function BeyondNoteDocumentPageRoute({ params }: PageProps) {
  const { documentId } = await params;
  return <BeyondNoteDocumentPage documentId={documentId} />;
}







