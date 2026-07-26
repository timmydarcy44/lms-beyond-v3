import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import {
  getJessicaQuestionnaireFromDb,
  resolveJessicaQuestionnaire,
  seedBuiltinJessicaQuestionnaires,
} from "@/lib/queries/jessica-questionnaires";
import { JessicaQuestionnaireEditorClient } from "@/components/jessica-contentin/jessica-questionnaire-editor-client";

export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export default async function JessicaQuestionnaireEditPage({ params }: Props) {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== JESSICA_CONTENTIN_EMAIL) redirect("/super");

  const { slug } = await params;

  let row = await getJessicaQuestionnaireFromDb(slug);
  if (!row) {
    // Semer les builtins puis réessayer (ex. premier accès)
    await seedBuiltinJessicaQuestionnaires(user.id);
    row = await getJessicaQuestionnaireFromDb(slug);
  }

  if (!row) {
    const fallback = await resolveJessicaQuestionnaire(slug);
    if (!fallback) notFound();
    // Pas encore en base : on affiche l’éditeur en mode create-from-fallback impossible sans id
    // On force un seed ciblé via create path message
    return (
      <JessicaQuestionnaireEditorClient
        mode="edit"
        questionnaire={{ ...fallback, id: undefined }}
      />
    );
  }

  return <JessicaQuestionnaireEditorClient mode="edit" questionnaire={row} />;
}
