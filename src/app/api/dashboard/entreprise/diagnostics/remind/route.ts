import { NextRequest, NextResponse } from "next/server";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { sendCollaboratorInviteEmail } from "@/lib/onboarding/emails";
import { publicAppUrl } from "@/lib/env";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Relance les invitations de diagnostic pour les collaborateurs encore en attente. */
export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!("organizationId" in access) || !access.organizationId) {
    return NextResponse.json({ error: "Organisation non configurée" }, { status: 400 });
  }

  let body: { employee_ids?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const ids = Array.isArray(body.employee_ids) ? body.employee_ids.map(String) : [];
  if (!ids.length) return NextResponse.json({ error: "Aucun collaborateur" }, { status: 400 });

  if (isJadeDemoEmail(access.viewer.email)) {
    return NextResponse.json({ sent: ids.length, demo: true });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: org } = await service.from("organizations").select("name").eq("id", access.organizationId).maybeSingle();
  const { data: employees, error } = await service
    .from("employees")
    .select("id, email, first_name")
    .eq("company_id", access.organizationId)
    .in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const link = `${publicAppUrl()}/login`;
  let sent = 0;
  for (const employee of employees ?? []) {
    const email = String(employee.email ?? "").trim();
    if (!email.includes("@")) continue;
    await sendCollaboratorInviteEmail({
      email,
      firstName: String(employee.first_name ?? ""),
      companyName: String((org as { name?: string } | null)?.name ?? "votre entreprise"),
      inviteLink: link,
    });
    sent += 1;
  }
  return NextResponse.json({ sent });
}
