import { NextResponse } from "next/server";

import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { buildSkillsGapPayload } from "@/lib/entreprise/skills-gap-load";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const access = await resolveEntrepriseOverviewAccess();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    if ("superAdminPreview" in access && access.superAdminPreview) {
      return NextResponse.json({ error: "Mode aperçu — organisation non liée" }, { status: 400 });
    }
    if ("configurationRequired" in access && access.configurationRequired) {
      return NextResponse.json(
        { error: "Organisation non configurée", needsOnboarding: true },
        { status: 400 },
      );
    }

    const service = getServiceRoleClient();
    if (!service) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const payload = await buildSkillsGapPayload(service, {
      organizationId: access.organizationId,
      viewer: access.viewer,
    });

    // Ne pas renvoyer toutes les lignes individuelles au client (payload trop lourd).
    const { individual_rows: _rows, ...rest } = payload;
    return NextResponse.json(rest);
  } catch (error) {
    console.error("[besoins-competences]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
