import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseAssistantAccess } from "@/lib/entreprise/assistant-access";
import { loadCompanyTutorSpaces } from "@/lib/entreprise/company-tutor-spaces";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ tutorId: string }> }) {
  const access = await resolveEntrepriseAssistantAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { tutorId } = await context.params;
  const spaces = await loadCompanyTutorSpaces(db, access.organizationId);
  if (!spaces.hasApprentices) {
    return NextResponse.json({ error: "Aucun alternant n'est rattaché à cette entreprise." }, { status: 404 });
  }
  const tutor = spaces.tutors.find((item) => item.id === tutorId);
  if (!tutor) return NextResponse.json({ error: "Cet espace tuteur n'appartient pas à l'entreprise." }, { status: 404 });
  return NextResponse.json({ tutor });
}
