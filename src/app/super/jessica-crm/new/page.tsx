import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { JessicaCrmCreateClientForm } from "@/components/jessica-contentin/crm/jessica-crm-create-client-form";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";

export default async function JessicaCrmNewClientPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (user?.email?.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) {
    redirect("/super");
  }

  return (
    <JessicaSuperPage
      title="Ajouter un client"
      subtitle="Prénom, nom, email et téléphone — disponible ensuite pour les factures."
      backHref="/super/jessica-crm"
      backLabel="Retour au CRM"
      narrow
    >
      <JessicaCrmCreateClientForm />
    </JessicaSuperPage>
  );
}
