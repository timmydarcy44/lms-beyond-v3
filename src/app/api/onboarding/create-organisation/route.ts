import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { createOrganizationFromDeal } from "@/lib/onboarding/create-organization-server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  company_name?: string;
  drh_email?: string;
  drh_name?: string;
  estimated_users?: number;
  deal_id?: string;
};

export async function POST(request: NextRequest) {
  try {
    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const service = getServiceRoleClient();
    if (!service) {
      console.error("[onboarding/create-organisation] SUPABASE_SERVICE_ROLE_KEY manquante ou invalide");
      return NextResponse.json(
        {
          error: "Service Supabase indisponible",
          detail: "SUPABASE_SERVICE_ROLE_KEY absente ou incorrecte sur le serveur (Vercel → Environment Variables)",
          step: "service_client",
        },
        { status: 503 },
      );
    }

    let body: Body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    }

    const company_name = String(body.company_name ?? "").trim();
    const drh_email = String(body.drh_email ?? "").trim().toLowerCase();
    const drh_name = String(body.drh_name ?? "").trim();
    const deal_id = String(body.deal_id ?? "").trim();
    const estimated_users =
      body.estimated_users != null && Number.isFinite(Number(body.estimated_users))
        ? Number(body.estimated_users)
        : null;

    if (!company_name || !drh_email || !drh_name || !deal_id) {
      return NextResponse.json(
        { error: "company_name, drh_email, drh_name et deal_id sont requis" },
        { status: 400 },
      );
    }

    const result = await createOrganizationFromDeal(service, {
      company_name,
      drh_email,
      drh_name,
      estimated_users,
      deal_id,
    });

    return NextResponse.json({
      success: true,
      organisation: result.organisation,
      organisation_id: result.organisation_id,
    });
  } catch (e) {
    const err = e as Error & { status?: number; organization_id?: string; step?: string };
    const status = err.status ?? 500;
    console.error("[onboarding/create-organisation] Échec:", {
      step: err.step ?? "unknown",
      message: err.message,
      stack: err.stack,
      organization_id: err.organization_id,
    });
    return NextResponse.json(
      {
        error: err.message || "Erreur serveur",
        step: err.step,
        detail:
          status === 500
            ? "Vérifiez SUPABASE_SERVICE_ROLE_KEY, la migration 20260602120000_client_onboarding_workflow.sql, et les logs inviteUserByEmail"
            : undefined,
        organization_id: err.organization_id,
      },
      { status },
    );
  }
}
