"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";
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
    <div className={SALARIE_PAGE_SHELL}>
      <section className="mb-8 space-y-2">
        <p className={SALARIE_PAGE_KICKER}>Entreprise</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mes formations</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Formations Byound Business assignées à votre entreprise. Ouvrez une carte pour la session, le formateur et l’Open Badge.
        </p>
      </section>

      <div className="relative mb-6 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher une formation, un formateur, un badge"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-400/40"
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-white/55">Aucune formation entreprise ne correspond.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((formation) => (
            <button
              key={formation.id}
              type="button"
              onClick={() => setOpenId(formation.id)}
              className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#12141A] text-left transition hover:border-white/20"
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
                <p className="text-base font-semibold text-white">{formation.title}</p>
                <p className="text-sm text-white/50">{formation.trainer}</p>
                <p className="text-xs text-white/40">
                  {formation.date} · {formation.place}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-h-[min(88vh,820px)] overflow-y-auto border-white/10 bg-[#12141A] text-white sm:max-w-xl">
          {selected ? (
            <div className="space-y-5">
              {selected.coverUrl ? (
                <img src={selected.coverUrl} alt="" className="h-40 w-full rounded-2xl object-cover" />
              ) : null}
              <div>
                <DialogTitle className="text-2xl font-bold text-white">{selected.title}</DialogTitle>
                <p className="mt-1 text-sm text-white/55">Formateur · {selected.trainer}</p>
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
                  <dt className="text-white/40">Date</dt>
                  <dd className="text-white">{selected.date}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Heure</dt>
                  <dd className="text-white">{selected.time}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Lieu</dt>
                  <dd className="text-white">{selected.place}</dd>
                </div>
              </dl>
              <div>
                <p className="text-sm font-semibold text-white">Objectifs pédagogiques</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
                  {selected.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Modalités</p>
                <p className="mt-1 text-sm text-white/75">{selected.modalities}</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C9C2FF]/40 bg-[#6E5BFF]/20 text-[10px] font-bold uppercase tracking-wide text-[#C9C2FF]">
                  Badge
                </div>
                <div>
                  <p className="text-xs text-white/40">Open Badge</p>
                  <p className="text-sm font-semibold text-white">{selected.badgeName}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
