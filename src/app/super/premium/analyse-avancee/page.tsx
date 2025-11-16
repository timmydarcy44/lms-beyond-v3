import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";

export default async function AnalyseAvanceePage() {
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <SuperAdminShell
      title="Analyse avancée"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Premium", href: "/super/premium" },
        { label: "Analyse avancée" },
      ]}
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Analyse avancée
          </h2>
          <p className="text-gray-600">
            Cette fonctionnalité sera disponible prochainement.
          </p>
        </div>
      </div>
    </SuperAdminShell>
  );
}


