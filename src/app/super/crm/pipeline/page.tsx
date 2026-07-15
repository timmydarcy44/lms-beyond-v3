import type { PipelineType } from "@/lib/crm/pipeline-shared";
import { getServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { PipelinePageClient } from "./pipeline-page-client";

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

  if (pipelineType === "btoc" && userEmail === "jerome.picot@edgebs.fr") {
    redirect("/super/crm/pipeline");
  }

  return <PipelinePageClient pipelineType={pipelineType} currentUserEmail={userEmail} />;
}
