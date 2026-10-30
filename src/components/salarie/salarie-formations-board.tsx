"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { SALARIE_PAGE_SHELL } from "@/lib/salarie/connect-nav";
import type { SalarieAssignedFormation } from "@/lib/salarie/assigned-formations";

export function SalarieFormationsBoard({ formations }: { formations: SalarieAssignedFormation[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return formations;
    return formations.filter(
      (formation) =>
        formation.title.toLowerCase().includes(q) ||
        (formation.presentation ?? "").toLowerCase().includes(q) ||
        (formation.meta ?? "").toLowerCase().includes(q),
    );
  }, [formations, query]);

  return (
    <div className={`${SALARIE_PAGE_SHELL} min-h-screen text-white`}>
      <section className="mb-8">
        <h1 className="text-[clamp(1.8rem,3vw,2.4rem)] font-extrabold tracking-[-0.03em]">Mes formations</h1>
        <p className="mt-2 max-w-xl text-[13px] text-white/45">Uniquement les formations auxquelles vous êtes inscrit.</p>
      </section>

      <div className="relative mb-6 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher une formation"
          className="h-12 w-full rounded-full border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35"
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-white/45">Aucune formation ne vous est encore assignée.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((formation) => (
            <Link
              key={formation.id}
              href={formation.href}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] text-left"
            >
              <div className="aspect-[16/10] bg-[#12141a]">
                {formation.coverImage ? (
                  <img src={formation.coverImage} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="space-y-3 px-5 py-4">
                <p className="text-[15px] font-extrabold tracking-[-0.02em] text-white">{formation.title}</p>
                {formation.presentation ? (
                  <p className="line-clamp-2 text-[13px] text-white/45">{formation.presentation}</p>
                ) : null}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-white/55">
                    <span>Complétion</span>
                    <span>{Math.round(formation.progress)} %</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                    <div
                      className="h-full rounded-full bg-[#3D7BFF]"
                      style={{ width: `${Math.max(0, Math.min(100, formation.progress))}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
