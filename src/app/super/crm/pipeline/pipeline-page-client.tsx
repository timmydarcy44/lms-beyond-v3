"use client";

import { Suspense, useRef } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PipelineBtobSubnav } from "@/components/super-admin/pipeline-btob-subnav";
import { isPipelinePrescripteurUser } from "@/lib/crm/pipeline-prescripteur-access";
import type { PipelineType } from "@/lib/crm/pipeline-shared";

import { JarvisTodoCta } from "./jarvis-todo-cta";
import { PipelineBoardClient, type PipelineBoardHandle } from "./pipeline-board-client";

type PipelinePageClientProps = {
  pipelineType: PipelineType;
  currentUserEmail: string | null;
};

export function PipelinePageClient({ pipelineType, currentUserEmail }: PipelinePageClientProps) {
  const boardRef = useRef<PipelineBoardHandle>(null);
  const isBtoc = pipelineType === "btoc";

  return (
    <div className="space-y-6 px-3 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">CRM / Pipeline</p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {isBtoc ? "Pipeline BTOC" : "Pipeline BTOB"}
              </h1>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 shrink-0 rounded-full"
                title="Ajouter un prospect"
                aria-label="Ajouter un prospect"
                onClick={() => boardRef.current?.openCreateProspect()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              {isBtoc
                ? "Parcours apprenants B2C — mis à jour depuis la base (inscription, badge, paiement)."
                : "Glissez les cartes entre les colonnes. Modifiez les étapes et les fiches à tout moment."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <JarvisTodoCta />
          </div>
        </div>
        {!isBtoc && isPipelinePrescripteurUser(currentUserEmail) ? (
          <Suspense fallback={null}>
            <PipelineBtobSubnav />
          </Suspense>
        ) : null}
      </div>
      <PipelineBoardClient
        ref={boardRef}
        pipelineType={pipelineType}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
}
