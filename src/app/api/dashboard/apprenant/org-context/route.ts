import { NextResponse } from "next/server";
import { resolveAndLinkEmployeeProfile } from "@/lib/entreprise/resolve-employee-profile";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ has_organisation: false });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return NextResponse.json({ has_organisation: false }, { status: 401 });
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaOrgId =
    (typeof meta.company_id === "string" && meta.company_id) ||
    (typeof meta.organization_id === "string" && meta.organization_id) ||
    null;
  const metaEmployeeId = typeof meta.employee_id === "string" ? meta.employee_id : null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, entreprise_id, company_id")
    .eq("id", user.id)
    .maybeSingle();

  let hasOrganisation = Boolean(
    profile?.school_id || profile?.entreprise_id || profile?.company_id || metaOrgId,
  );

  const service = getServiceRoleClient();
  if (service) {
    let employee: {
      id: string;
      email?: string | null;
      profile_id?: string | null;
      company_id?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    } | null = null;

    if (metaEmployeeId) {
      const { data } = await service
        .from("employees")
        .select("id, email, profile_id, company_id, first_name, last_name")
        .eq("id", metaEmployeeId)
        .maybeSingle();
      employee = data;
    }

    if (!employee) {
      const { data } = await service
        .from("employees")
        .select("id, email, profile_id, company_id, first_name, last_name")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      employee = data;
    }

    if (!employee && user.email) {
      const normalized = user.email.trim().toLowerCase();
      const { data } = await service
        .from("employees")
        .select("id, email, profile_id, company_id, first_name, last_name")
        .eq("email", normalized)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      employee = data;
    }

    if (employee?.company_id) {
      hasOrganisation = true;
      await resolveAndLinkEmployeeProfile(
        service,
        {
          ...employee,
          profile_id: user.id,
          first_name: employee.first_name ?? undefined,
          last_name: employee.last_name ?? undefined,
        },
        user.id,
      );
      await service
        .from("profiles")
        .update({
          first_name: employee.first_name,
          last_name: employee.last_name,
          full_name: [employee.first_name, employee.last_name].filter(Boolean).join(" "),
          company_id: employee.company_id,
        })
        .eq("id", user.id);
    } else if (metaOrgId) {
      await service
        .from("profiles")
        .upsert({ id: user.id, company_id: metaOrgId }, { onConflict: "id" });
      hasOrganisation = true;
    }
  }

  return NextResponse.json({
    has_organisation: hasOrganisation,
    company_id: profile?.company_id ?? metaOrgId ?? null,
    school_id: profile?.school_id ?? null,
  });
}
