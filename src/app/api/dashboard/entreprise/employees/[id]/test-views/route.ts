import { NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  if (!UUID_RE.test(employeeId)) {
    return NextResponse.json({ logged: false });
  }

  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ logged: false });

  const { data: employee, error: employeeError } = await service
    .from("employees")
    .select("id, company_id")
    .eq("id", employeeId)
    .maybeSingle();
  if (employeeError || !employee) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }
  const companyId = String((employee as { company_id?: string | null }).company_id ?? "");
  if ("organizationId" in access && access.organizationId && companyId && companyId !== access.organizationId) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  const { error } = await service.from("employee_test_views").insert({
    employee_id: employeeId,
    viewer_id: access.userId,
    viewed_at: new Date().toISOString(),
  });
  if (error) {
    if (/employee_test_views|schema cache|relation|does not exist/i.test(error.message)) {
      return NextResponse.json({ logged: false });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ logged: true });
}
