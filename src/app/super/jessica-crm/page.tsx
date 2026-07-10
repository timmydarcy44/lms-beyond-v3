import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaUsersList } from "@/lib/queries/jessica-users";
import { getJessicaResources } from "@/lib/queries/jessica-resources";
import { JessicaCrmUsersList } from "@/components/jessica-contentin/crm/jessica-crm-users-list";
import { JessicaSuperPage, JessicaSuperButton, JessicaSuperStatCard } from "@/components/jessica-contentin/super/jessica-super-ui";
import { Plus, Users, Stethoscope } from "lucide-react";

export const revalidate = 0;

export default async function JessicaCrmPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (user?.email?.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) {
    redirect("/super");
  }

  const [users, resources] = await Promise.all([getJessicaUsersList(), getJessicaResources()]);

  return (
    <JessicaSuperPage
      title="CRM — Clients"
      subtitle="Gérez vos clients et assignez des formations visibles sur Mon compte."
      actions={
        <>
          <JessicaSuperButton href="/super/jessica-crm/patients" variant="outline">
            <Stethoscope className="h-4 w-4" />
            Patients cabinet
          </JessicaSuperButton>
          <JessicaSuperButton href="/super/jessica-crm/new">
            <Plus className="h-4 w-4" />
            Ajouter un client
          </JessicaSuperButton>
        </>
      }
    >
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <JessicaSuperStatCard
          label="Clients"
          value={users.length}
          icon={<Users className="h-5 w-5" />}
        />
        <JessicaSuperStatCard label="Formations disponibles" value={resources.length} />
        <JessicaSuperStatCard
          label="Assignations actives"
          value={users.reduce((s, u) => s + u.purchaseCount, 0)}
          accent
        />
      </div>

      <JessicaCrmUsersList initialUsers={users} availableResources={resources} />
    </JessicaSuperPage>
  );
}
