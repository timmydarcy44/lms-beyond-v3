"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { PROFIL_EDGE_SECTION_BASE } from "@/lib/particulier/profil-edge-maturity";

export function useProfilEdgeSaveReturn() {
  const router = useRouter();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const finishSave = useCallback(() => {
    setSavedMessage("Enregistré.");
    window.setTimeout(() => {
      router.push(PROFIL_EDGE_SECTION_BASE);
    }, 700);
  }, [router]);

  return { savedMessage, finishSave, clearSavedMessage: () => setSavedMessage(null) };
}
