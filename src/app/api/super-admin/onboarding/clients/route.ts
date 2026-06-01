import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: orgs, error } = await service
    .from("organizations")
    .select("id, name, onboarding_step, estimated_users, created_from_deal")
    .not("onboarding_step", "is", null)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const clients = await Promise.all(
    (orgs ?? []).map(async (org) => {
      const { count } = await service
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("company_id", org.id);

      let drh_email: string | null = null;
      const { data: profile } = await service
        .from("profiles")
        .select("email")
        .eq("company_id", org.id)
        .in("role_type", ["entreprise", "admin_hr"])
        .limit(1)
        .maybeSingle();
      drh_email = (profile?.email as string) ?? null;

      return {
        id: org.id,
        name: org.name,
        onboarding_step: org.onboarding_step,
        estimated_users: org.estimated_users,
        created_from_deal: org.created_from_deal,
        employee_count: count ?? 0,
        drh_email,
      };
    }),
  );

  return NextResponse.json({ clients });
}
