"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  EmargementPublicClient,
  type EmargePublicContext,
} from "@/components/attendance/emargement-public-client";

export default function EmargementSessionPage() {
  const params = useParams();
  const token = String(params.token ?? "");
  const [context, setContext] = useState<EmargePublicContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/attendance/session/${encodeURIComponent(token)}`);
        const json = (await res.json()) as { error?: string; context?: EmargePublicContext };
        if (!res.ok) throw new Error(json.error || "Lien invalide");
        setContext(json.context ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] text-[#A3A8C7]">
        Ouverture de la session…
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] px-4 text-[#F3F4FA]">
        <div className="max-w-md rounded-2xl border border-[#262A4A] bg-[#141731] p-6 text-center">
          <h1 className="text-xl font-bold">Session indisponible</h1>
          <p className="mt-2 text-sm text-red-300">{error}</p>
          <a href="/e" className="mt-4 inline-block text-sm text-[#B7AEFF] underline">
            Entrer le code manuellement
          </a>
        </div>
      </main>
    );
  }

  return <EmargementPublicClient launchToken={token} initialContext={context} />;
}
