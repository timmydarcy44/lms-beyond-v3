import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AdminBeyondCareDashboard } from "@/components/beyond-care/admin-beyond-care-dashboard";
import { isUserAdminWithFeature } from "@/lib/queries/organization-features";

export default async function FormateurBeyondCarePage() {
  const session = await getSession();
  
  if (!session?.id) {
    redirect("/login");
  }

  // Vérifier si l'utilisateur est admin dans au moins une organisation avec Beyond Care
  const isAdmin = await isUserAdminWithFeature("beyond_care");
  
  if (!isAdmin) {
    redirect("/dashboard/formateur");
  }

  return (
    <DashboardShell
      title="Beyond Care"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Beyond Care" },
      ]}
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:px-10">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-white md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-white/60">Nouveau</p>
              <p className="text-lg font-semibold">
                Découvrir le Dashboard Elite Performance
              </p>
            </div>
            <Link
              href="/dashboard/beyond-care-elite"
              className="inline-flex items-center justify-center rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Ouvrir Elite Performance
            </Link>
          </div>
        </div>
        <AdminBeyondCareDashboard />
      </div>
    </DashboardShell>
  );
}

