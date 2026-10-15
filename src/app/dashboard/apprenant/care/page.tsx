"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { CareExpertListItem } from "@/app/api/dashboard/apprenant/care/experts/route";
import { APPRENANT_PAGE_SHELL } from "@/lib/apprenant/connect-nav";

const OFFERS = [
  { objective: "Gestion du stress", title: "Coach stress et charge mentale", person: "Camille Roux", format: "Visio · 45 min" },
  { objective: "Coach de vie", title: "Clarifier une décision professionnelle", person: "Noah Petit", format: "Visio · 1 h" },
  { objective: "Coach parental", title: "Équilibre famille et rythme de formation", person: "Inès Morel", format: "Visio · 45 min" },
  { objective: "Confiance", title: "Préparer un entretien ou une prise de parole", person: "Léa Bernard", format: "Visio · 30 min" },
];

export default function ApprenantCarePage() {
  const [experts, setExperts] = useState<CareExpertListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/apprenant/care/experts", { credentials: "include" });
        const json = (await res.json()) as { experts?: CareExpertListItem[] };
        if (!cancelled) setExperts(json.experts ?? []);
      } catch {
        if (!cancelled) setExperts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`${APPRENANT_PAGE_SHELL} max-w-3xl pb-24`}>
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Byound Care</p>
        <h1 className="text-[1.85rem] font-bold tracking-[-0.03em] text-white sm:text-[2.1rem]">Accompagnement</h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-white/55">
          Des professionnels selon votre objectif. Même interface que le reste de l&apos;espace.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {OFFERS.map((offer) => (
          <article key={offer.title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">{offer.objective}</p>
            <h2 className="mt-2 text-[1.15rem] font-semibold text-white">{offer.title}</h2>
            <p className="mt-3 text-sm text-white/70">{offer.person}</p>
            <p className="mt-1 text-xs text-white/45">{offer.format}</p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/40">Experts disponibles</h2>
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {(experts.length
              ? experts.map((expert) => ({
                  id: expert.id,
                  name: [expert.firstName, expert.lastName].filter(Boolean).join(" ") || "Expert Care",
                  line: expert.headline || expert.specialties.slice(0, 3).join(" · "),
                }))
              : OFFERS.map((offer) => ({ id: offer.title, name: offer.person, line: offer.objective }))
            ).map((row) => (
              <li key={row.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div>
                  <p className="font-semibold text-white">{row.name}</p>
                  <p className="text-sm text-white/50">{row.line}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black">Voir</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
