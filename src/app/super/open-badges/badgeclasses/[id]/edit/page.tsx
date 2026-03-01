import { redirect } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { BadgeClassForm } from "../../_components/badgeclass-form";

type RouteParams = { params: { id: string } };

export default async function SuperAdminBadgeClassEditPage({ params }: RouteParams) {
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
      title="Éditer un Badge Class"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Open Badges", href: "/super/open-badges/badgeclasses" },
        { label: "Édition" },
      ]}
    >
      <BadgeClassForm auth={{ userId: data.user.id, userRole: "SUPER_ADMIN" }} badgeClassId={params.id} />
    </SuperAdminShell>
  );
}
