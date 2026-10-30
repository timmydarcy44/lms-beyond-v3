import { NextResponse } from "next/server";
import { resolveEntrepriseAssistantAccess } from "@/lib/entreprise/assistant-access";
import { loadCompanyTutorSpaces } from "@/lib/entreprise/company-tutor-spaces";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await resolveEntrepriseAssistantAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const spaces = await loadCompanyTutorSpaces(db, access.organizationId);
  return NextResponse.json(spaces);
}
