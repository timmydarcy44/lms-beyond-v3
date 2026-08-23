import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
import { JessicaPatientDocumentsPanel } from "@/components/jessica-contentin/crm/jessica-patient-documents-panel";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";

export const revalidate = 0;

export default async function JessicaAdministratifDocumentsPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== JESSICA_CONTENTIN_EMAIL) redirect("/super");

  const service = getServiceRoleClient() ?? supabase;
  const { data: patients } = await service
    .from("jessica_cabinet_patients")
    .select("id, first_name, last_name, email, profile_id")
    .order("last_name", { ascending: true })
    .limit(500);

  const options = (patients ?? []).map((p) => {
    const row = p as {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
      profile_id?: string | null;
    };
    return {
      id: row.id,
      profileId: row.profile_id ?? null,
      label: formatClientName(row.first_name, row.last_name, row.email || "Patient"),
    };
  });

  return (
    <JessicaSuperPage
      title="Documents patients"
      subtitle="Déposez les pièces reçues : elles sont sauvegardées sur la fiche individuelle du patient."
      backHref="/super/jessica-administratif"
      backLabel="Administratif"
      narrow
    >
      <JessicaPatientDocumentsPanel patients={options} />
    </JessicaSuperPage>
  );
}
