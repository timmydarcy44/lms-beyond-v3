import { redirect } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { BadgeClassForm } from "../_components/badgeclass-form";

export default async function SuperAdminBadgeClassNewPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login");
  }
  const { data } = await supabase.auth.getUser();
  if (!data?.user?.id) {
    redirect("/login");
  }

  return (
    <SuperAdminShell
      title="Créer un Badge Class"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Open Badges", href: "/super/open-badges/badgeclasses" },
        { label: "Nouveau Badge" },
      ]}
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Créer un Open Badge</h1>
        <p className="text-sm text-slate-600">
          Définissez un badge et ses critères d’obtention.
        </p>
      </div>
      <div className="mt-6">
        <BadgeClassForm auth={{ userId: data.user.id, userRole: "SUPER_ADMIN" }} />
      </div>
    </SuperAdminShell>
  );
}
