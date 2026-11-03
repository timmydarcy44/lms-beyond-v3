"use client";

import { useState } from "react";
import type { FormationProposal } from "@/lib/expert/formation-proposals";

const STATUS: Record<FormationProposal["status"], string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Refusée",
};

function Block({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{value}</p>
    </div>
  );
}

export function ExpertFormationProposals({ proposals }: { proposals: FormationProposal[] }) {
  const [open, setOpen] = useState<FormationProposal | null>(null);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Propositions de formation</h2>
      </div>
      <div className="p-5">
        {proposals.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune proposition de formation.</p>
        ) : (
          <ul className="space-y-3">
            {proposals.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {STATUS[item.status]}
                    {item.priceEur != null ? ` · ${item.priceEur.toLocaleString("fr-FR")} €` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(item)}
                  className="rounded-full bg-[#07080B] px-4 py-2 text-sm font-semibold text-white"
                >
                  Voir la formation
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={open.title}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#4B3BD1]">{STATUS[open.status]}</p>
                <h3 className="mt-1 text-2xl font-extrabold tracking-tight">{open.title}</h3>
              </div>
              <button type="button" onClick={() => setOpen(null)} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold">
                Fermer
              </button>
            </div>
            <div className="mt-6 space-y-5">
              <Block label="Description" value={open.presentation} />
              <Block label="Objectifs pédagogiques" value={open.objectives} />
              <Block label="Prérequis" value={open.prerequisites} />
              <Block label="Publics" value={open.audience} />
              <Block label="Tarif souhaité" value={open.priceEur != null ? `${open.priceEur.toLocaleString("fr-FR")} €` : ""} />
              <Block label="Formats" value={open.formats.join(", ")} />
              <Block label="Contenu" value={open.content} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
