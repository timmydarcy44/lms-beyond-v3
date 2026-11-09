"use client";

import { PipelineDealFormationDossiers } from "@/components/crm/pipeline-deal-formation-dossiers";

/**
 * Ancien onglet Qualiopi (crm_qualiopi_sessions, API 410).
 * Redirige vers les vrais dossiers formation (formation_dossiers).
 */
export function PipelineDealQualiopiDossier({
  dealId,
  organizationId,
  tone = "light",
}: {
  dealId?: string;
  organizationId?: string | null;
  tone?: "light" | "dark";
}) {
  return (
    <div className="space-y-3">
      <p
        className={
          tone === "dark" ? "text-xs text-slate-400" : "text-xs text-gray-500"
        }
      >
        Les dossiers Qualiopi sont désormais gérés via les dossiers formation
        (devis → convention → session).
      </p>
      <PipelineDealFormationDossiers
        dealId={dealId}
        organizationId={organizationId}
        tone={tone}
      />
    </div>
  );
}
