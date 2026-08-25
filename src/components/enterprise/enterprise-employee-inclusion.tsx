"use client";

import { useState } from "react";
import { Accessibility, FileCheck, Shield, X } from "lucide-react";
import {
  accommodationCategoryLabel,
  evidenceKindLabel,
  type EmployeeInclusionProfile,
} from "@/lib/entreprise/inclusion-accommodations";
import { cn } from "@/lib/utils";

type Props = {
  employeeName: string;
  profile: EmployeeInclusionProfile | null | undefined;
  className?: string;
};

export function EnterpriseEmployeeInclusionCta({ employeeName, profile, className }: Props) {
  const [open, setOpen] = useState(false);
  const data = profile ?? {
    status: "none" as const,
    summary: null,
    factors: [],
    accommodations: [],
    notes: null,
  };
  const hasFactors = data.factors.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-bold text-teal-900 transition hover:bg-teal-100",
          className,
        )}
      >
        <Accessibility className="h-4 w-4" />
        Inclusion / accessibilité
        {hasFactors ? (
          <span className="rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            {data.accommodations.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-gray-100 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-600">
                  Inclusion & accessibilité
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">{employeeName}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Aménagements possibles selon les éléments déclarés ou prouvés.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!hasFactors ? (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
                <Shield className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm font-semibold text-gray-800">
                  Aucun élément d’inclusion déclaré
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Dès qu’un handicap, une RQTH ou une difficulté est déclarée ou documentée, les
                  aménagements recommandés apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                    Éléments connus
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {data.factors.map((factor) => (
                      <li
                        key={factor.id}
                        className="rounded-2xl border border-gray-100 bg-[#f7f7f5] px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">{factor.label}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              factor.kind === "proven" && "bg-emerald-100 text-emerald-800",
                              factor.kind === "declared" && "bg-blue-100 text-blue-800",
                              factor.kind === "signal" && "bg-amber-100 text-amber-800",
                            )}
                          >
                            {evidenceKindLabel(factor.kind)}
                          </span>
                        </div>
                        {factor.detail ? (
                          <p className="mt-1 text-sm text-gray-500">{factor.detail}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                    Aménagements possibles
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {data.accommodations.map((acc) => (
                      <li
                        key={acc.id}
                        className="flex gap-3 rounded-2xl border border-teal-100 bg-teal-50/50 px-4 py-3"
                      >
                        <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                            {accommodationCategoryLabel(acc.category)}
                          </p>
                          <p className="mt-0.5 font-semibold text-gray-900">{acc.title}</p>
                          <p className="mt-1 text-sm text-gray-600">{acc.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                {data.notes ? (
                  <p className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
                    <span className="font-semibold">Note RH :</span> {data.notes}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
