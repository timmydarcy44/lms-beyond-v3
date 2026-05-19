import { notFound, redirect } from "next/navigation";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ pathId: string }>;
};

export default async function FormateurPathPage({ params }: PageProps) {
  const { pathId } = await params;

  if (!pathId) notFound();

  const supabase = await getServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) redirect("/login");

  const service = getServiceRoleClient();
  const admin = service ?? (await getServiceRoleClientOrFallback());
  const db = admin ?? supabase;

  const { data: path } = await db
    .from("paths")
    .select("id, creator_id, org_id")
    .eq("id", pathId)
    .limit(1)
    .maybeSingle();

  if (!path) notFound();
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    const creatorId = String((path as any).creator_id ?? "").trim();
    const orgId = String((path as any).org_id ?? "").trim();
    const isOwner = creatorId === authData.user.id;
    let isStaffInOrg = false;
    if (orgId) {
      const { data: m } = await db
        .from("org_memberships")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", authData.user.id)
        .maybeSingle();
      const role = String((m as any)?.role ?? "").toLowerCase().trim();
      isStaffInOrg = ["admin", "instructor", "formateur", "trainer", "owner", "staff"].includes(role);
    }
    let profileMatchesOrg = false;
    if (orgId) {
      const { data: prof } = await supabase.from("profiles").select("org_id").eq("id", authData.user.id).maybeSingle();
      const pOrg = String((prof as any)?.org_id ?? "").trim();
      profileMatchesOrg = Boolean(pOrg && pOrg === orgId);
    }
    if (!isOwner && !isStaffInOrg && !profileMatchesOrg) notFound();
  }

  redirect(`/dashboard/formateur/parcours/${pathId}/edit`);
}

