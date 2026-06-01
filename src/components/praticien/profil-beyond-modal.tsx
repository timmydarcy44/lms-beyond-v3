"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  sessionId: string | null;
  onClose: () => void;
};

export function ProfilBeyondModal({ sessionId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    collaborateur?: { first_name?: string; full_name?: string };
    profilBeyond?: Record<string, unknown> | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    setData(null);
    void fetch(`/api/marketplace/sessions/${sessionId}/profil-beyond`)
      .then(async (res) => {
        const json = (await res.json()) as typeof data & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Accès refusé");
        setData(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (!sessionId) return null;

  const name =
    data?.collaborateur?.first_name || data?.collaborateur?.full_name?.split(" ")[0] || "Collaborateur";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#1a1d27] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">Profil Beyond — {name}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {!loading && !error && data?.profilBeyond && (
          <dl className="mt-4 space-y-3 text-sm">
            {Object.entries(data.profilBeyond).map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate-500">{k}</dt>
                <dd className="mt-0.5 font-medium">{v != null ? String(v) : "—"}</dd>
              </div>
            ))}
          </dl>
        )}
        {!loading && !error && !data?.profilBeyond && (
          <p className="mt-4 text-sm text-slate-400">Aucun diagnostic Beyond actif pour ce collaborateur.</p>
        )}
        <Button type="button" className="mt-6 w-full" variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
}
