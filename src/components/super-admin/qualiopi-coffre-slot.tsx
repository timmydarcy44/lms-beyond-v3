"use client";

import { ChevronRight, FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QualiopiPlanExamples } from "@/components/super-admin/qualiopi-plan-examples";
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

export function QualiopiCoffreSlot({
  coffre,
  loading,
  loadError,
  onRetry,
  onDeposit,
  onRemove,
}: Props) {
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

      <QualiopiPlanExamples />

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
