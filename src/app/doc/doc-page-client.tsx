"use client";

import { useSearchParams } from "next/navigation";
import { PublicDocumentClient } from "@/components/formation-documents/public-document-client";

/**
 * Vue publique devis/convention — /doc?token=…&accept=…
 */
export function DocPageClient() {
  const search = useSearchParams();
  const token = (search.get("token") || search.get("t") || "").trim();
  const accept = (search.get("accept") || "").trim();

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0B12] px-4 text-[#F3F4FA]">
        <p className="text-sm text-red-300">Lien invalide — token manquant.</p>
      </main>
    );
  }

  return <PublicDocumentClient token={token} acceptToken={accept} />;
}
