import { NextRequest, NextResponse } from "next/server";
import { ensureDisabilityAccommodationRequest } from "@/lib/handicap/create-request";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Contact / demande d'aménagement depuis l'espace apprenant ou salarié.
 * Corps : { contact_referent?: boolean, has_rqth?: boolean, message?: string,
 *           accommodation_needed?: boolean, needs_text?: string }
 */
export async function POST(req: NextRequest) {
  const client = await getServerClient();
  const {
    data: { user },
  } = client ? await client.auth.getUser() : { data: { user: null } };
  if (!user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    accommodation_needed?: boolean;
    contact_referent?: boolean;
    has_rqth?: boolean;
    message?: string | null;
    needs_text?: string | null;
  } | null;

  const contact = Boolean(body?.contact_referent);
  const accommodation = Boolean(body?.accommodation_needed);
  if (!contact && !accommodation) {
    return NextResponse.json(
      { error: "contact_referent ou accommodation_needed requis" },
      { status: 400 },
    );
  }

  const message = String(body?.message ?? body?.needs_text ?? "").trim() || null;
  if (contact && body?.has_rqth && !message) {
    return NextResponse.json(
      { error: "Un message est requis pour contacter la référente" },
      { status: 400 },
    );
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: profile } = await service
    .from("profiles")
    .select("id, email, reference_email")
    .eq("id", user.id)
    .maybeSingle();

  const email =
    String(profile?.email ?? "").trim() ||
    String(profile?.reference_email ?? "").trim() ||
    user.email ||
    null;

  const { data: employee } = await service
    .from("employees")
    .select("id, company_id, email")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  const { data: cfaApp } = !employee
    ? await service
        .from("cfa_applications")
        .select("id, email")
        .eq("profile_id", user.id)
        .neq("status", "rejected")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  if (employee?.id && body?.has_rqth) {
    await service
      .from("employees")
      .update({
        rqth: true,
        rqth_declared_at: new Date().toISOString(),
        rqth_needs_summary: message,
      })
      .eq("id", employee.id);
  }

  const scope = employee ? "business" : cfaApp ? "school" : "business";
  const result = await ensureDisabilityAccommodationRequest(service, {
    scope,
    employeeId: employee?.id ?? null,
    cfaApplicationId: cfaApp?.id ?? null,
    personProfileId: user.id,
    organizationId: employee?.company_id ?? null,
    needsText: message,
    contactMessage: contact ? message : null,
    personEmail: email || employee?.email || cfaApp?.email || null,
  });

  if (!result) {
    return NextResponse.json({ error: "Création impossible" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    caseId: result.caseId,
    created: result.created,
  });
}
