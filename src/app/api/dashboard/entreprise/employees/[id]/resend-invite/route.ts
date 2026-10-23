import { NextResponse } from "next/server";
import { isEdgebsDemoEmployeeId } from "@/lib/entreprise/edgebs-demo-enrich";
import { deliverCollaboratorInvite } from "@/lib/entreprise/deliver-collaborator-invite";
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
  if (isEdgebsDemoEmployeeId(employeeId) || !UUID_RE.test(employeeId)) {
    return NextResponse.json({ error: "Action non disponible sur un profil démo" }, { status: 400 });
  }

  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: employee } = await service
    .from("employees")
    .select("id, email, first_name, last_name")
    .eq("id", employeeId)
    .eq("company_id", access.organizationId)
    .maybeSingle();
  if (!employee) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

  const email = String(employee.email ?? "").trim();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Ce collaborateur n'a pas d'email" }, { status: 400 });
  }

  const { data: org } = await service
    .from("organizations")
    .select("name")
    .eq("id", access.organizationId)
    .maybeSingle();

  const invite = await deliverCollaboratorInvite(service, {
    email,
    firstName: String(employee.first_name ?? ""),
    lastName: String(employee.last_name ?? ""),
    companyName: String(org?.name ?? "votre entreprise"),
    organizationId: access.organizationId,
    employeeId,
  });

  if (!invite.sent) {
    return NextResponse.json({ error: invite.error ?? "Envoi impossible" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
