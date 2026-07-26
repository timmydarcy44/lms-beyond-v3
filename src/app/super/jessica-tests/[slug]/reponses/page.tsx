import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import {
  listJessicaQuestionnaireResponses,
  resolveJessicaQuestionnaire,
} from "@/lib/queries/jessica-questionnaires";
import { JessicaQuestionnaireResponsesClient } from "@/components/jessica-contentin/jessica-questionnaire-responses-client";

export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export default async function JessicaQuestionnaireResponsesPage({ params }: Props) {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== JESSICA_CONTENTIN_EMAIL) redirect("/super");

  const { slug } = await params;
  const questionnaire = await resolveJessicaQuestionnaire(slug);
  if (!questionnaire) notFound();

  const responses = await listJessicaQuestionnaireResponses(slug);

  return (
    <JessicaQuestionnaireResponsesClient questionnaire={questionnaire} responses={responses} />
  );
}
