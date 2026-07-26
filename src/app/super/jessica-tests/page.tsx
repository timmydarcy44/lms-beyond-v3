import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import {
  countJessicaQuestionnaireResponsesBySlug,
  listResolvedJessicaQuestionnaires,
  listJessicaQuestionnairesFromDb,
} from "@/lib/queries/jessica-questionnaires";
import { JessicaTestsHubClient } from "@/components/jessica-contentin/jessica-tests-hub-client";

export const revalidate = 0;

export default async function JessicaTestsPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== JESSICA_CONTENTIN_EMAIL) redirect("/super");

  const [questionnaires, counts, dbRows] = await Promise.all([
    listResolvedJessicaQuestionnaires(),
    countJessicaQuestionnaireResponsesBySlug(),
    listJessicaQuestionnairesFromDb({ includeInactive: true }),
  ]);

  const idBySlug = Object.fromEntries(dbRows.map((r) => [r.slug, r.id]));

  return (
    <JessicaTestsHubClient
      questionnaires={questionnaires.map((q) => ({
        ...q,
        id: idBySlug[q.slug],
      }))}
      counts={counts}
    />
  );
}
