"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Period = {
  id: string;
  index?: number;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
};

export default function LivretPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [hasBooklet, setHasBooklet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/apprenant/livret", { credentials: "include" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Chargement impossible");
        if (!cancelled) {
          setHasBooklet(Boolean(j.booklet));
          setPeriods((j.periods ?? []) as Period[]);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16 pt-1 text-[#F2F4FA]">
      <header>
        <h1 className="text-[34px] font-extrabold tracking-tight sm:text-[40px]">
          Livret d’apprentissage
        </h1>
        <p className="mt-2 text-sm text-[#9AA3BD]">
          Les périodes à remplir et à signer avec ton tuteur.
        </p>
      </header>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      {!hasBooklet ? (
        <p className="text-sm text-[#9AA3BD]">
          Ton livret n’est pas encore ouvert. Il se crée quand ton tuteur démarre le suivi — tu
          seras prévenu pour signer chaque période.
        </p>
      ) : periods.length === 0 ? (
        <p className="text-sm text-[#9AA3BD]">Aucune période pour l’instant.</p>
      ) : (
        <ul className="divide-y divide-[#1C2443]">
          {periods.map((p) => {
            const needs = p.status === "awaiting_student";
            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold">Période {p.index ?? "—"}</p>
                  <p className="text-xs text-[#6C7593]">
                    {[p.start_date, p.end_date].filter(Boolean).join(" → ") || "Dates à venir"}
                    {p.status ? ` · ${p.status}` : ""}
                  </p>
                </div>
                {needs ? (
                  <Link
                    href={`/livret/periode/${p.id}`}
                    className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0A0F1E]"
                  >
                    Signer →
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-[#9AA3BD]">
                    {p.status === "signed" || p.status === "awaiting_cfa" ? "Signée" : "En cours"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/dashboard/apprenant/planning/absences"
        className="inline-flex text-sm font-semibold text-[#8DB8FF]"
      >
        Signaler une absence →
      </Link>
    </div>
  );
}
