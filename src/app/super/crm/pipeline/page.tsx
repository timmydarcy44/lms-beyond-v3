import { PipelineBoardClient } from "./pipeline-board-client";
import type { PipelineType } from "@/lib/crm/pipeline-shared";
import { getServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JarvisTodoCta } from "./jarvis-todo-cta";

export default async function CrmPipelinePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const typeParam = params?.type;
  const typeRaw = Array.isArray(typeParam) ? typeParam[0] : typeParam;
  const pipelineType: PipelineType = typeRaw === "btoc" ? "btoc" : "btob";

  const supabase = await getServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const userEmail = user?.email?.trim().toLowerCase() ?? null;

  // Jérôme n'a pas accès au pipeline BTOC : redirection vers BTOB.
  if (pipelineType === "btoc" && userEmail === "jerome.picot@edgebs.fr") {
    redirect("/super/crm/pipeline");
  }

  return (
    <div className="space-y-6 px-3 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">CRM / Pipeline</p>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {pipelineType === "btoc" ? "Pipeline BTOC" : "Pipeline BTOB"}
        </h1>
        <p className="text-sm text-gray-600">
          {pipelineType === "btoc"
            ? "Parcours apprenants B2C — mis à jour depuis la base (inscription, badge, paiement)."
            : "Glissez les cartes entre les colonnes. Modifiez les étapes et les fiches à tout moment."}
        </p>
        </div>
        <div className="flex items-center gap-2">
          <JarvisTodoCta />
        </div>
      </div>
      <PipelineBoardClient pipelineType={pipelineType} currentUserEmail={userEmail} />
    </div>
  );
}
