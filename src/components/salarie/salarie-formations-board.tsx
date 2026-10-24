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
    <div className={`${SALARIE_PAGE_SHELL} min-h-screen bg-[#F4F5F7] text-[#14151A]`}>
      <section className="mb-8 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B909A]">Entreprise</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#14151A]">Mes formations</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#5C6370]">
          Uniquement les formations auxquelles vous êtes inscrit.
        </p>
      </section>

      <div className="relative mb-6 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B909A]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher une formation"
          className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm text-[#14151A] outline-none placeholder:text-[#8B909A]"
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-[#5C6370]">Aucune formation ne vous est encore assignée.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((formation) => (
            <Link
              key={formation.id}
              href={formation.href}
              className="overflow-hidden rounded-[28px] bg-white text-left shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="space-y-2 p-5">
                <p className="text-base font-semibold text-[#14151A]">{formation.title}</p>
                {formation.presentation ? (
                  <p className="line-clamp-3 text-sm text-[#5C6370]">{formation.presentation}</p>
                ) : null}
                <p className="text-xs text-[#8B909A]">
                  {formation.progress > 0 ? `${formation.progress} %` : "À commencer"}
                  {formation.meta ? ` · ${formation.meta}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
