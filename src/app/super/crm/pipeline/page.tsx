import { PipelineBoardClient } from "./pipeline-board-client";
import type { PipelineType } from "@/lib/crm/pipeline-shared";

export default async function CrmPipelinePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const typeParam = params?.type;
  const typeRaw = Array.isArray(typeParam) ? typeParam[0] : typeParam;
  const pipelineType: PipelineType = typeRaw === "btoc" ? "btoc" : "btob";

  return (
    <div className="space-y-6 px-6 py-8">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">CRM / Pipeline</p>
        <h1 className="text-3xl font-bold text-gray-900">
          {pipelineType === "btoc" ? "Pipeline BTOC" : "Pipeline BTOB"}
        </h1>
        <p className="text-sm text-gray-600">
          {pipelineType === "btoc"
            ? "Parcours apprenants B2C — mis à jour depuis la base (inscription, badge, paiement)."
            : "Glissez les cartes entre les colonnes. Modifiez les étapes et les fiches à tout moment."}
        </p>
      </div>
      <PipelineBoardClient pipelineType={pipelineType} />
    </div>
  );
}
