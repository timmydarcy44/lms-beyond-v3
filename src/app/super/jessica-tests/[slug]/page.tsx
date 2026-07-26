import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaCrmContacts } from "@/lib/queries/jessica-crm-contacts";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import { resolveJessicaQuestionnaire } from "@/lib/queries/jessica-questionnaires";
import { JessicaQuestionnaireFillClient } from "@/components/jessica-contentin/jessica-questionnaire-fill-client";

export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ contact?: string }>;
};

export default async function JessicaQuestionnaireFillPage({ params, searchParams }: Props) {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== JESSICA_CONTENTIN_EMAIL) redirect("/super");

  const { slug } = await params;
  const { contact } = await searchParams;
  const questionnaire = await resolveJessicaQuestionnaire(slug);
  if (!questionnaire) notFound();

  const contacts = await getJessicaCrmContacts();
  const fillContacts = contacts
    .filter((c) => c.email?.includes("@"))
    .map((c) => {
      const first = c.firstName?.trim() || null;
      const last = c.lastName?.trim() || null;
      let label = formatClientName(first, last, c.fullName ?? c.email);
      if (last) label = first ? `${first} ${last.toUpperCase()}` : last.toUpperCase();
      const profileId = c.id || null;
      const patientId = c.patientId || null;
      return {
        id: profileId ? `user:${profileId}` : patientId ? `patient:${patientId}` : `email:${c.email}`,
        label,
        email: c.email,
        firstName: first,
        lastName: last,
        profileId,
        patientId,
      };
    });

  return (
    <JessicaQuestionnaireFillClient
      questionnaire={questionnaire}
      contacts={fillContacts}
      preselectContactId={contact}
    />
  );
}
