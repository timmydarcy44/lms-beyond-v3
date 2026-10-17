import { NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!("organizationId" in access) || !access.organizationId) {
    return NextResponse.json({ requests: [] });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ requests: [] });
  const { data, error } = await db
    .from("training_requests")
    .select("id, label, message, urgency, status, created_at, user_id")
    .eq("company_id", access.organizationId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ requests: [], unavailable: true });
  return NextResponse.json({ requests: data ?? [] });
}
