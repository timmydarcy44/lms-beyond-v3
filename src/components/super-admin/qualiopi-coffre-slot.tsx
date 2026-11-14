"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, ListChecks, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QualiopiDocument } from "@/lib/crm/qualiopi-shared";
import type { CoffreAdminSlot, CoffreAdminStatus } from "@/lib/qualiopi/coffre-admin";
import { cn } from "@/lib/utils";

type Props = {
  coffre: CoffreAdminStatus;
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onDeposit: (slot: CoffreAdminSlot) => void;
  onRemove: (doc: QualiopiDocument) => void;
};

/** Exemples pédagogiques — pas des preuves déposées. */
const EXAMPLE_PROCESS = {
  title: "Exemple de process — mise à jour du coffre",
  steps: [
    "Rédiger ou faire valider le modèle (convention, règlement ou livret) par la direction.",
    "Exporter en PDF versionnée (ex. Convention_OF_2026-v1.pdf).",
    "Déposer le fichier dans le slot correspondant ci-dessous.",
    "À chaque révision majeure : remplacer le fichier et noter la date dans le nom.",
  ],
};

const EXAMPLE_DOCUMENT = {
  title: "Exemple de document — convention de formation (trame)",
  body: `Convention de formation professionnelle

1. Parties
   - Organisme de formation : Byound / Edge Business School
   - Client : [Raison sociale]

2. Objet
   - Intitulé de la formation, objectifs, durée, modalités (présentiel / distanciel / mixte).

3. Conditions financières
   - Tarif HT, modalités de facturation, prise en charge éventuelle (OPCO, CPF…).

4. Obligations
   - OF : moyens pédagogiques, émargement, attestation.
   - Client : désignation des stagiaires, paiement.

5. Accessibilité
   - Référente handicap : contact OF — étude personnalisée.

6. Signatures
   - Date, noms, qualités.`,
};

export function QualiopiCoffreSlot({
  coffre,
  loading,
  loadError,
  onRetry,
  onDeposit,
  onRemove,
}: Props) {
  const [planOpen, setPlanOpen] = useState(coffre.deposited === 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Coffre administratif</h2>
          <p className="mt-1 text-sm text-[#9AA3BD]">
            Convention, règlement intérieur, livret d’accueil — source unique pour l’indicateur 1.
          </p>
        </div>
        <span className="text-sm font-medium tabular-nums text-white/70">
          {coffre.deposited} / {coffre.expected} déposés
        </span>
      </div>

      {/* CTA — ce que l’on va faire (exemples, pas des preuves) */}
      <div className="rounded-[24px] border border-[#26304F] bg-[#111831]">
        <button
          type="button"
          onClick={() => setPlanOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6E5BFF]/20 text-[#C9C2FF]">
              <ListChecks className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[15px] font-extrabold text-[#F2F4FA]">
                Ce que l&apos;on va faire
              </span>
              <span className="block text-[12px] text-[#9AA3BD]">
                Exemple de process + exemple de document — en attendant les vraies preuves
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#9AA3BD] transition",
              planOpen ? "rotate-180" : "",
            )}
          />
        </button>

        {planOpen ? (
          <div className="grid gap-3 border-t border-[#1A2340] px-5 py-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4">
              <p className="text-[12px] font-semibold text-[#A99BFF]">Exemple de process</p>
              <h3 className="mt-1 text-[14px] font-extrabold text-[#F2F4FA]">
                {EXAMPLE_PROCESS.title.replace(/^Exemple de process — /, "")}
              </h3>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-[13px] leading-relaxed text-[#9AA3BD]">
                {EXAMPLE_PROCESS.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>

            <article className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4">
              <p className="text-[12px] font-semibold text-[#F2CF6B]">Exemple de document</p>
              <h3 className="mt-1 text-[14px] font-extrabold text-[#F2F4FA]">
                Convention de formation (trame)
              </h3>
              <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#0A0F1E] p-3 font-mono text-[11px] leading-relaxed text-[#9AA3BD]">
                {EXAMPLE_DOCUMENT.body}
              </pre>
            </article>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-[#FF8A9B]/30 bg-[#FF8A9B]/10 p-4 text-sm text-[#FF8A9B]">
          {loadError}
          <Button size="sm" className="ml-3 rounded-full bg-white text-[#0A0F1E]" onClick={onRetry}>
            Réessayer
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coffre.slots.map((slot) => {
            const doc = slot.document;
            return (
              <div
                key={slot.kind}
                className="relative rounded-2xl border border-[#1A2340] bg-[#111831] p-4"
              >
                <span
                  className={cn(
                    "absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                    slot.deposited
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-amber-500/25 bg-amber-500/10 text-amber-200",
                  )}
                >
                  {slot.deposited ? "Déposé" : "À déposer"}
                </span>
                <FileText className="h-8 w-8 text-[#6E5BFF]/80" />
                <div className="mt-3 pr-16 font-semibold text-white">{slot.title}</div>
                <p className="mt-1 text-xs text-[#9AA3BD]">
                  {doc?.file_name ? doc.file_name : "Aucun fichier"}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => onDeposit(slot)}
                    className="rounded-lg bg-[#6E5BFF] text-white hover:bg-[#5a4ae0]"
                  >
                    <Upload className="mr-1 h-3 w-3" />
                    {slot.deposited ? "Remplacer" : "Déposer"}
                  </Button>
                  {doc?.file_url ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  ) : null}
                  {doc?.file_url ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/40 hover:bg-white/5 hover:text-white/70"
                      onClick={() => onRemove(doc)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
