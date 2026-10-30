import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { offerSkillSchema, replaceOfferSkills, listOfferSkills } from "@/lib/entreprise/offer-skills";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function ownedOffer(id: string) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return { error: NextResponse.json({ error: access.error }, { status: access.status }) };
  if (!("organizationId" in access)) return { error: NextResponse.json({ error: "Action non autorisée" }, { status: 400 }) };
  const service = getServiceRoleClient();
  if (!service) return { error: NextResponse.json({ error: "Service indisponible" }, { status: 503 }) };
  const { data } = await service.from("job_offers").select("id, school_id").eq("id", id).maybeSingle();
  if (!data || (String(data.school_id ?? "") !== access.organizationId && !(await isSuperAdmin()))) {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  return { service, organizationId: access.organizationId };
}

export async function GET(_request: NextRequest, context: Params) {
  const { id } = await context.params;
  const owned = await ownedOffer(id);
  if ("error" in owned) return owned.error;
  try {
    const skills = await listOfferSkills(owned.service, id);
    return NextResponse.json({ skills });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lecture impossible" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const owned = await ownedOffer(id);
  if ("error" in owned) return owned.error;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const parsed = z.object({ skills: z.array(offerSkillSchema).max(8) }).safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "8 compétences maximum, avec un nom." }, { status: 400 });
  try {
    const skills = await replaceOfferSkills(owned.service, id, owned.organizationId, parsed.data.skills);
    return NextResponse.json({ skills });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Enregistrement impossible" }, { status: 400 });
  }
}
