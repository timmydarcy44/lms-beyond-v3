import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import {
  getJessicaQuestionnaireResponse,
  resolveJessicaQuestionnaire,
} from "@/lib/queries/jessica-questionnaires";
import { JessicaQuestionnaireResponseDetailClient } from "@/components/jessica-contentin/jessica-questionnaire-response-detail-client";

export const revalidate = 0;

type Props = { params: Promise<{ slug: string; id: string }> };

export default async function JessicaQuestionnaireResponseDetailPage({ params }: Props) {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== JESSICA_CONTENTIN_EMAIL) redirect("/super");

  const { slug, id } = await params;
  const questionnaire = await resolveJessicaQuestionnaire(slug);
  if (!questionnaire) notFound();

  const response = await getJessicaQuestionnaireResponse(id);
  if (!response || response.questionnaire_slug !== slug) notFound();

  return (
    <JessicaQuestionnaireResponseDetailClient questionnaire={questionnaire} response={response} />
  );
}
