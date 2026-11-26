"use client";

import { useState } from "react";
import { Download, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QualiopiPlanExamples } from "@/components/super-admin/qualiopi-plan-examples";
import { QUALIOPI_INDICATORS } from "@/lib/qualiopi/indicators";

type Props = {
  open: boolean;
  indicatorId: number | null;
  proofHref: string | null;
  actionLabel?: string;
  onClose: () => void;
};

export function QualiopiProofGuide({
  open,
  indicatorId,
  proofHref,
  actionLabel = "Ouvrir la preuve",
  onClose,
}: Props) {
  const [pdfBusy, setPdfBusy] = useState(false);

  if (!open || indicatorId == null) return null;

  const def = QUALIOPI_INDICATORS.find((i) => i.id === indicatorId);
  const external = Boolean(proofHref && /^https?:\/\//i.test(proofHref));

  async function exportPdf() {
    setPdfBusy(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/indicators/${indicatorId}/pdf`);
      if (!res.ok) {
        toast.error("Export PDF impossible");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qualiopi-ind-${indicatorId}-preuve.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`PDF indicateur ${indicatorId} téléchargé`);
    } catch {
      toast.error("Export PDF impossible");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preuve indicateur ${indicatorId}`}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#26304F] bg-[#0B1122] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#1A2340] px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Ind. {indicatorId}
            </p>
            <h2 className="text-base font-extrabold text-white">
              {def?.shortTitle ?? "Preuve Qualiopi"}
            </h2>
            {def?.summary ? (
              <p className="mt-1 text-[12.5px] leading-snug text-[#9AA3BD]">{def.summary}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/70 hover:bg-white/10"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          <p className="text-[12px] font-semibold text-[#C9C2FF]">Processus attendu</p>
          <QualiopiPlanExamples indicatorId={indicatorId} compact />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#1A2340] px-4 py-3">
          <Button
            type="button"
            variant="outline"
            className="border-white/15 bg-transparent text-white"
            onClick={onClose}
          >
            Fermer
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pdfBusy}
            className="border-white/15 bg-transparent text-white"
            onClick={() => void exportPdf()}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {pdfBusy ? "PDF…" : "Exporter PDF"}
          </Button>
          {proofHref ? (
            <a
              href={proofHref}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#6E5BFF] px-3 text-sm font-semibold text-white hover:bg-[#5a49e6]"
              onClick={onClose}
            >
              {actionLabel}
              {external ? <ExternalLink className="h-3.5 w-3.5" /> : null}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
