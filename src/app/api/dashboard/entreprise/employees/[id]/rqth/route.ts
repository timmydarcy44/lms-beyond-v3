import { NextRequest, NextResponse } from "next/server";
import { isEdgebsDemoEmployeeId } from "@/lib/entreprise/edgebs-demo-enrich";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { ensureDisabilityAccommodationRequest } from "@/lib/handicap/create-request";
import { syncEmployeeHandicapProfile } from "@/lib/handicap/sync";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Déclaration RQTH salarié → employees + handicap_profiles (Business). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  if (isEdgebsDemoEmployeeId(employeeId) || !UUID_RE.test(employeeId)) {
    return NextResponse.json({ error: "Action non disponible sur un profil démo" }, { status: 400 });
  }

  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    rqth?: boolean;
    needs_summary?: string | null;
    accommodation_needed?: boolean;
  } | null;
  if (!body || typeof body.rqth !== "boolean") {
    return NextResponse.json({ error: "rqth (boolean) requis" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: existing, error: existingError } = await service
    .from("employees")
    .select("id, company_id, first_name, last_name, email")
    .eq("id", employeeId)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });
  if (!existing) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

  const companyId = String(existing.company_id ?? "");
  if (companyId && companyId !== access.organizationId) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  const needs = body.needs_summary != null ? String(body.needs_summary).trim() || null : null;
  const patch = {
    rqth: body.rqth,
    rqth_declared_at: body.rqth ? new Date().toISOString() : null,
    rqth_needs_summary: body.rqth ? needs : null,
  };

  const { data, error } = await service
    .from("employees")
    .update(patch)
    .eq("id", employeeId)
    .select("id, rqth, rqth_declared_at, rqth_needs_summary, first_name, last_name, email, company_id")
    .maybeSingle();

  if (error) {
    if (/rqth|schema cache|column/i.test(error.message)) {
      return NextResponse.json(
        { error: "Colonnes RQTH absentes — appliquez la migration handicap." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

  await syncEmployeeHandicapProfile(service, {
    id: String(data.id),
    company_id: data.company_id ? String(data.company_id) : companyId || null,
    first_name: data.first_name ? String(data.first_name) : null,
    last_name: data.last_name ? String(data.last_name) : null,
    email: data.email ? String(data.email) : null,
    rqth: Boolean(data.rqth),
    rqth_needs_summary: data.rqth_needs_summary ? String(data.rqth_needs_summary) : null,
  });

  const accommodationNeeded =
    Boolean(body.accommodation_needed) || (Boolean(body.rqth) && Boolean(needs));
  if (accommodationNeeded) {
    await ensureDisabilityAccommodationRequest(service, {
      scope: "business",
      employeeId: String(data.id),
      organizationId: data.company_id ? String(data.company_id) : companyId || null,
      needsText: needs,
      personEmail: data.email ? String(data.email) : null,
    });
  }

  return NextResponse.json({
    employee: {
      id: data.id,
      rqth: Boolean(data.rqth),
      rqth_declared_at: data.rqth_declared_at,
      rqth_needs_summary: data.rqth_needs_summary,
    },
  });
}
