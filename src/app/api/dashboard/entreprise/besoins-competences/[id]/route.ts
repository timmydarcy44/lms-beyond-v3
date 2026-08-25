import { NextRequest, NextResponse } from "next/server";

import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { buildSkillsGapPayload, findNeedInPayload } from "@/lib/entreprise/skills-gap-load";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });
    }

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

    const need = findNeedInPayload(payload, id);
    if (!need) {
      return NextResponse.json({ error: "Besoin introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      scale: payload.scale,
      need,
      stats: payload.stats,
      demo_enriched: payload.demo_enriched ?? false,
    });
  } catch (error) {
    console.error("[besoins-competences/id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
