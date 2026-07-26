import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import {
  countJessicaQuestionnaireResponsesBySlug,
  listResolvedJessicaQuestionnaires,
  listJessicaQuestionnairesFromDb,
} from "@/lib/queries/jessica-questionnaires";
import { getJessicaCrmContacts } from "@/lib/queries/jessica-crm-contacts";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
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

  const [questionnaires, counts, dbRows, crmContacts] = await Promise.all([
    listResolvedJessicaQuestionnaires(),
    countJessicaQuestionnaireResponsesBySlug(),
    listJessicaQuestionnairesFromDb({ includeInactive: true }),
    getJessicaCrmContacts(),
  ]);

  const idBySlug = Object.fromEntries(dbRows.map((r) => [r.slug, r.id]));

  const contacts = crmContacts
    .filter((c) => c.email?.includes("@"))
    .map((c) => {
      const first = c.firstName?.trim() || null;
      const last = c.lastName?.trim() || null;
      let label = formatClientName(first, last, c.fullName ?? c.email);
      if (last) label = first ? `${first} ${last.toUpperCase()}` : last.toUpperCase();
      return {
        id: c.id ? `user:${c.id}` : c.patientId ? `patient:${c.patientId}` : `email:${c.email}`,
        label,
        email: c.email,
        firstName: first,
        lastName: last,
        profileId: c.id || null,
        patientId: c.patientId || null,
      };
    });

  return (
    <JessicaTestsHubClient
      questionnaires={questionnaires.map((q) => ({
        ...q,
        id: idBySlug[q.slug],
      }))}
      counts={counts}
      contacts={contacts}
    />
  );
}
