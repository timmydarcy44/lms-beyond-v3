import { redirect } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { BadgeClassList } from "./_components/badgeclass-list";

export default async function SuperAdminBadgeClassesPage() {
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
      title="Open Badges — Badge Classes"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Open Badges", href: "/super/open-badges/badgeclasses" },
        { label: "Badge Classes" },
      ]}
    >
      <BadgeClassList auth={{ userId: data.user.id, userRole: "SUPER_ADMIN" }} />
    </SuperAdminShell>
  );
}
