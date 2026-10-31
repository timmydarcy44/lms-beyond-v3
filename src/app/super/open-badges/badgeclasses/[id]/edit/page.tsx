import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { BadgeClassForm } from "../../_components/badgeclass-form";

type RouteParams = { params: Promise<{ id: string }> };

export default async function SuperAdminBadgeClassEditPage({ params }: RouteParams) {
  const { id: badgeClassId } = await params;
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
    <BadgeClassForm
      auth={{ userId: data.user.id, userRole: "SUPER_ADMIN" }}
      badgeClassId={badgeClassId}
    />
  );
}
