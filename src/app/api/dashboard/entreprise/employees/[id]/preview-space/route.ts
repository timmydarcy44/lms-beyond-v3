import { NextRequest, NextResponse } from "next/server";
import { isEntrepriseManagerRole } from "@/lib/auth/entreprise-manager-role";
import {
  buildLearnerPreviewCookie,
  LEARNER_PREVIEW_COOKIE,
} from "@/lib/control/learner-preview";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * RH / admin entreprise : ouvre l’espace du collaborateur en lecture seule.
 * Admin RH → dashboard/entreprise ; salarié → dashboard/salarie (cookie preview).
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  if (!employeeId?.trim() || !UUID_RE.test(employeeId)) {
    return NextResponse.json({ error: "Collaborateur invalide" }, { status: 400 });
  }

  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("configurationRequired" in access || "superAdminPreview" in access) {
    return NextResponse.json({ error: "Organisation requise" }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: employee } = await service
    .from("employees")
    .select("id, first_name, last_name, email, profile_id, company_id")
    .eq("id", employeeId)
    .maybeSingle();
  if (!employee) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  if (String(employee.company_id) !== access.organizationId) {
    return NextResponse.json({ error: "Hors de votre organisation" }, { status: 403 });
  }

  const profileId = String(employee.profile_id ?? "").trim();
  if (!profileId) {
    return NextResponse.json(
      { error: "Ce collaborateur n’a pas encore activé son compte" },
      { status: 400 },
    );
  }

  const targetName =
    [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim() ||
    String(employee.email ?? "Collaborateur");

  const { data: profile } = await service
    .from("profiles")
    .select("role, role_type")
    .eq("id", profileId)
    .maybeSingle();

  if (
    isEntrepriseManagerRole(
      (profile as { role?: string | null } | null)?.role,
      (profile as { role_type?: string | null } | null)?.role_type,
    )
  ) {
    return NextResponse.json({
      ok: true,
      targetUserId: profileId,
      targetName,
      href: "/dashboard/entreprise",
      space: "entreprise",
    });
  }

  const cookie = await buildLearnerPreviewCookie({
    staffId: access.userId,
    targetUserId: profileId,
    targetName,
  });
  if (!cookie) {
    return NextResponse.json({ error: "Secret d'accompagnement manquant" }, { status: 503 });
  }

  const response = NextResponse.json({
    ok: true,
    targetUserId: profileId,
    targetName,
    href: "/dashboard/salarie",
    space: "salarie",
  });
  response.cookies.set(LEARNER_PREVIEW_COOKIE, cookie.token, cookie.options);
  return response;
}
