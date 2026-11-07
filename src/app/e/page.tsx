"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmargementPublicClient } from "@/components/attendance/emargement-public-client";
import { EmargementProjectClient } from "@/components/attendance/emargement-project-client";
import type { EmargePublicContext } from "@/components/attendance/emargement-public-client";

/**
 * /e — entrée publique.
 * - /e?slot=… → écran projeté formateur (QR)
 * - /e?launch=… → page éphémère apprenant (cours + formateur)
 * - /e → saisie du code salle
 *
 * Query params : contournement d'un 404 Vercel sur /e/p et /e/s.
 */
function EmargementEntryInner() {
  const search = useSearchParams();
  const slotId = (search.get("slot") || search.get("slotId") || "").trim();
  const launchToken = (search.get("launch") || search.get("s") || "").trim();
  const [context, setContext] = useState<EmargePublicContext | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [loadingLaunch, setLoadingLaunch] = useState(Boolean(launchToken));

  useEffect(() => {
    if (!launchToken) return;
    void (async () => {
      setLoadingLaunch(true);
      try {
        const res = await fetch(`/api/attendance/session/${encodeURIComponent(launchToken)}`);
        const json = (await res.json()) as { error?: string; context?: EmargePublicContext };
        if (!res.ok) throw new Error(json.error || "Lien invalide");
        setContext(json.context ?? null);
      } catch (e) {
        setLaunchError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoadingLaunch(false);
      }
    })();
  }, [launchToken]);

  if (slotId) {
    return <EmargementProjectClient slotId={slotId} />;
  }

  if (launchToken) {
    if (loadingLaunch) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] text-[#A3A8C7]">
          Ouverture de la session…
        </main>
      );
    }
    if (launchError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] px-4 text-[#F3F4FA]">
          <div className="max-w-md rounded-2xl border border-[#262A4A] bg-[#141731] p-6 text-center">
            <h1 className="text-xl font-bold">Session indisponible</h1>
            <p className="mt-2 text-sm text-red-300">{launchError}</p>
            <a href="/e" className="mt-4 inline-block text-sm text-[#B7AEFF] underline">
              Entrer le code manuellement
            </a>
          </div>
        </main>
      );
    }
    return <EmargementPublicClient launchToken={launchToken} initialContext={context} />;
  }

  return <EmargementPublicClient />;
}

export default function EmargementPublicPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] text-[#A3A8C7]">
          Chargement…
        </main>
      }
    >
      <EmargementEntryInner />
    </Suspense>
  );
}
