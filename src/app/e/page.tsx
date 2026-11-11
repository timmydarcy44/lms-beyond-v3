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
function BackstageEmargerGate({
  slotId,
  bt,
  sig,
}: {
  slotId: string;
  bt: string;
  sig: string;
}) {
  const [ok, setOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const q = new URLSearchParams({ bt, sig, slot: slotId });
        const res = await fetch(`/api/backstage/verify?${q.toString()}`);
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) {
          setError(
            json.error === "expired"
              ? "Ce lien Backstage a expiré."
              : "Lien Backstage invalide.",
          );
          setOk(false);
          return;
        }
        setOk(true);
      } catch {
        setError("Vérification impossible.");
        setOk(false);
      }
    })();
  }, [bt, sig, slotId]);

  if (ok === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] text-[#A3A8C7]">
        Vérification du lien…
      </main>
    );
  }
  if (!ok) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] px-4 text-[#F3F4FA]">
        <div className="max-w-md rounded-2xl border border-[#262A4A] bg-[#141731] p-6 text-center">
          <h1 className="text-xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-sm text-red-300">{error}</p>
          <a
            href="/dashboard/formateur"
            className="mt-4 inline-block text-sm text-[#B7AEFF] underline"
          >
            Ouvrir mon espace formateur
          </a>
        </div>
      </main>
    );
  }
  return <EmargementProjectClient slotId={slotId} />;
}

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
    const bt = (search.get("bt") || "").trim();
    const sig = (search.get("sig") || "").trim();
    // Lien Backstage signé : refus si jeton absent/invalide/expiré.
    // Les ouvertures internes (/e?slot= seul) restent possibles (salle / BO).
    if (bt || sig) {
      return <BackstageEmargerGate slotId={slotId} bt={bt} sig={sig} />;
    }
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
