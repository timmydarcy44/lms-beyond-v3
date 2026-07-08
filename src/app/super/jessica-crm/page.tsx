import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaUsersList } from "@/lib/queries/jessica-users";
import { getJessicaResources } from "@/lib/queries/jessica-resources";
import { JessicaCrmUsersList } from "@/components/jessica-contentin/crm/jessica-crm-users-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export const revalidate = 0;

export default async function JessicaCrmPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (user?.email?.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) {
    redirect("/super");
  }

  const [users, resources] = await Promise.all([getJessicaUsersList(), getJessicaResources()]);

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: "#2F2A25" }}>
              CRM — Clients
            </h1>
            <p className="text-lg" style={{ color: "#2F2A25", opacity: 0.7 }}>
              Gérez vos clients et assignez des formations visibles sur Mon compte.
            </p>
          </div>
          <Link href="/super/jessica-crm/new">
            <Button
              className="rounded-full px-6 py-3 text-base font-semibold shadow-lg"
              style={{ backgroundColor: "#C6A664", color: "white" }}
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter un client
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl border-2 p-6" style={{ borderColor: "#E6D9C6", backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full" style={{ backgroundColor: "#C6A66420" }}>
                <Users className="h-6 w-6" style={{ color: "#C6A664" }} />
              </div>
              <div>
                <p className="text-sm opacity-70">Clients</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border-2 p-6" style={{ borderColor: "#E6D9C6", backgroundColor: "#FFFFFF" }}>
            <p className="text-sm opacity-70">Formations disponibles</p>
            <p className="text-3xl font-bold">{resources.length}</p>
          </div>
          <div className="rounded-2xl border-2 p-6" style={{ borderColor: "#E6D9C6", backgroundColor: "#FFFFFF" }}>
            <p className="text-sm opacity-70">Assignations actives</p>
            <p className="text-3xl font-bold">{users.reduce((s, u) => s + u.purchaseCount, 0)}</p>
          </div>
        </div>

        <JessicaCrmUsersList initialUsers={users} availableResources={resources} />
      </div>
    </div>
  );
}
