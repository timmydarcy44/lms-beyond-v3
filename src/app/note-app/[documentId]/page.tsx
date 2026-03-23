"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BeyondNoteDocumentPage } from "@/components/beyond-note/beyond-note-document-page";

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  extracted_text: string | null;
  file_type: string;
}

export default function BeyondNoteDocumentRoute() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.documentId as string | undefined;
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      if (!documentId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/nevo/documents");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement du document");
        }
        const data = await response.json();
        const doc = data.documents?.find((d: Document) => d.id === documentId) || null;
        if (!doc) {
          setError("Document introuvable");
          toast.error("Document introuvable");
          return;
        }
        setDocument(doc);
        if (doc.extracted_text === "Extraction en cours...") {
          if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = setTimeout(() => {
            loadDocument();
          }, 5000);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur serveur";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    loadDocument();
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [documentId]);

  if (!documentId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 mx-auto mb-4 text-white/30" />
          <p className="text-lg font-semibold mb-2">{error}</p>
          <p className="text-sm text-white/40 mb-6">
            Ce document n'est plus disponible ou vous n'y avez pas accès.
          </p>
          <Button
            onClick={() => router.push("/beyond-note-app")}
            className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
          >
            Retour à la bibliothèque
          </Button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 mx-auto mb-4 text-white/30" />
          <p className="text-lg font-semibold mb-2">Aucun document</p>
          <p className="text-sm text-white/40 mb-6">
            Impossible d'afficher ce document pour le moment.
          </p>
          <Button
            onClick={() => router.push("/beyond-note-app")}
            className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
          >
            Retour à la bibliothèque
          </Button>
        </div>
      </div>
    );
  }

  return <BeyondNoteDocumentPage documentId={documentId} />;
}








