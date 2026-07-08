import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { JessicaCrmCreateClientForm } from "@/components/jessica-contentin/crm/jessica-crm-create-client-form";

export default async function JessicaCrmNewClientPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (user?.email?.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) {
    redirect("/super");
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8" style={{ color: "#2F2A25" }}>
          Ajouter un client
        </h1>
        <JessicaCrmCreateClientForm />
      </div>
    </div>
  );
}
