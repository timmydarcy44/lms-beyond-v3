import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaQuestionnaire } from "@/lib/jessica-contentin/questionnaires";
import { resolveJessicaQuestionnaire } from "@/lib/queries/jessica-questionnaires";
import { JessicaTypeformPlayer } from "@/components/jessica-contentin/jessica-typeform-player";

export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export default async function JessicaQuestionnairePreviewPage({ params }: Props) {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== JESSICA_CONTENTIN_EMAIL) redirect("/super");

  const { slug } = await params;
  const questionnaire =
    (await resolveJessicaQuestionnaire(slug)) ?? getJessicaQuestionnaire(slug);
  if (!questionnaire) notFound();

  return <JessicaTypeformPlayer questionnaire={questionnaire} preview />;
}
