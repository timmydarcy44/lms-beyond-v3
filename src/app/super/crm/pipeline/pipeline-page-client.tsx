"use client";

import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PipelineType } from "@/lib/crm/pipeline-shared";

import { JarvisTodoCta } from "./jarvis-todo-cta";
import { PipelineBoardClient, type PipelineBoardHandle } from "./pipeline-board-client";

type PipelinePageClientProps = {
  pipelineType: PipelineType;
  currentUserEmail: string | null;
  createOnLoad?: boolean;
};

export function PipelinePageClient({ pipelineType, currentUserEmail, createOnLoad = false }: PipelinePageClientProps) {
  const boardRef = useRef<PipelineBoardHandle>(null);
  const isBtoc = pipelineType === "btoc";

  useEffect(() => {
    if (!createOnLoad || isBtoc) return;
    boardRef.current?.openCreateProspect();
  }, [createOnLoad, isBtoc]);

  if (!isBtoc) {
    return (
      <div className="h-[calc(100dvh-68px)] min-h-0 overflow-hidden">
        <PipelineBoardClient
          ref={boardRef}
          pipelineType={pipelineType}
          currentUserEmail={currentUserEmail}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-3 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {isBtoc ? "Pipeline particuliers" : "Pipeline B2B"}
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
      </div>
      <PipelineBoardClient
        ref={boardRef}
        pipelineType={pipelineType}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
}
