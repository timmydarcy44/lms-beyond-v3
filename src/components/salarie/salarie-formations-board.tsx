"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SALARIE_PAGE_SHELL } from "@/lib/salarie/connect-nav";
import type { SalarieEnterpriseFormation } from "@/lib/salarie/enterprise-formations";

export function SalarieFormationsBoard({ formations }: { formations: SalarieEnterpriseFormation[] }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return formations;
    return formations.filter(
      (formation) =>
        formation.title.toLowerCase().includes(q) ||
        formation.trainer.toLowerCase().includes(q) ||
        formation.badgeName.toLowerCase().includes(q),
    );
  }, [formations, query]);

  const selected = formations.find((formation) => formation.id === openId) ?? null;

  return (
    <div className={`${SALARIE_PAGE_SHELL} min-h-screen bg-[#F4F5F7] text-[#14151A]`}>
      <section className="mb-8 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B909A]">Entreprise</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#14151A]">Mes formations</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#5C6370]">
          Formations Byound Business assignées à votre entreprise. Ouvrez une carte pour la session, le formateur et l’Open Badge.
        </p>
      </section>

      <div className="relative mb-6 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B909A]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher une formation, un formateur, un badge"
          className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm text-[#14151A] outline-none placeholder:text-[#8B909A]"
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-[#5C6370]">Aucune formation entreprise ne correspond.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((formation) => (
            <button
              key={formation.id}
              type="button"
              onClick={() => setOpenId(formation.id)}
              className="overflow-hidden rounded-[28px] bg-white text-left shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="relative h-40 bg-[#1E2130]">
                {formation.coverUrl ? (
                  <img src={formation.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-end p-4 text-sm font-semibold text-white/70">
                    {formation.badgeName}
                  </div>
                )}
              </div>
              <div className="space-y-1 p-4">
                <p className="text-base font-semibold text-[#14151A]">{formation.title}</p>
                <p className="text-sm text-[#5C6370]">{formation.trainer}</p>
                <p className="text-xs text-[#8B909A]">
                  {formation.date} · {formation.place}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-h-[min(88vh,820px)] overflow-y-auto border-black/10 bg-white text-[#14151A] sm:max-w-xl">
          {selected ? (
            <div className="space-y-5">
              {selected.coverUrl ? (
                <img src={selected.coverUrl} alt="" className="h-40 w-full rounded-2xl object-cover" />
              ) : null}
              <div>
                <DialogTitle className="text-2xl font-bold text-[#14151A]">{selected.title}</DialogTitle>
                <p className="mt-1 text-sm text-[#5C6370]">Formateur · {selected.trainer}</p>
              </div>
              <Link
                href={
                  selected.positioningDone
                    ? "/dashboard/salarie/badges"
                    : `/dashboard/salarie/formations/positionnement/${encodeURIComponent(selected.slug)}`
                }
                className="inline-flex rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
              >
                {selected.positioningDone
                  ? "Résultats du test de positionnement"
                  : "Faire le test de positionnement"}
              </Link>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[#8B909A]">Date</dt>
                  <dd>{selected.date}</dd>
                </div>
                <div>
                  <dt className="text-[#8B909A]">Heure</dt>
                  <dd>{selected.time}</dd>
                </div>
                <div>
                  <dt className="text-[#8B909A]">Lieu</dt>
                  <dd>{selected.place}</dd>
                </div>
              </dl>
              <div>
                <p className="text-sm font-semibold">Objectifs pédagogiques</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#3C4250]">
                  {selected.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold">Modalités</p>
                <p className="mt-1 text-sm text-[#3C4250]">{selected.modalities}</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-[#F4F5F7] p-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C9C2FF]/40 bg-[#6E5BFF]/20 text-[10px] font-bold uppercase tracking-wide text-[#C9C2FF]">
                  Badge
                </div>
                <div>
                  <p className="text-xs text-[#8B909A]">Open Badge</p>
                  <p className="text-sm font-semibold">{selected.badgeName}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
