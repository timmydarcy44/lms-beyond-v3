import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { createOrganizationFromDeal } from "@/lib/onboarding/create-organization-server";
import { OnboardingStepError } from "@/lib/onboarding/onboarding-errors";
import { verifyOnboardingSchema } from "@/lib/onboarding/verify-onboarding-schema";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  company_name?: string;
  drh_email?: string;
  drh_name?: string;
  estimated_users?: number;
  deal_id?: string;
};

function logEnvDiagnostics() {
  console.log("[onboarding/create-organisation] env check", {
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
  });
}

function errorResponse(
  error: string,
  step: string,
  detail: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  console.error("[onboarding/create-organisation] error response", { error, step, detail, status, ...extra });
  return NextResponse.json({ error, step, detail, ...extra }, { status });
}

export async function POST(request: NextRequest) {
  logEnvDiagnostics();

  try {
    console.log("[onboarding/create-organisation] step=auth_super_admin");
    if (!(await isSuperAdmin())) {
      return errorResponse("Accès refusé", "auth_super_admin", "Utilisateur non super-admin", 403);
    }

    console.log("[onboarding/create-organisation] step=service_client");
    const service = getServiceRoleClient();
    if (!service) {
      return errorResponse(
        "Service Supabase indisponible",
        "service_client",
        "SUPABASE_SERVICE_ROLE_KEY absente ou vide — ajoutez-la dans Vercel Environment Variables",
        503,
        {
          SUPABASE_SERVICE_ROLE_KEY: false,
          hint: "Ne jamais utiliser la clé anon ; il faut la service role (eyJ…)",
        },
      );
    }

    console.log("[onboarding/create-organisation] step=verify_schema");
    await verifyOnboardingSchema(service);

    let body: Body = {};
    try {
      body = await request.json();
    } catch (parseErr) {
      const detail = parseErr instanceof Error ? parseErr.message : "JSON invalide";
      return errorResponse("Corps invalide", "parse_body", detail, 400);
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
      return errorResponse(
        "Champs requis manquants",
        "validate_body",
        "company_name, drh_email, drh_name et deal_id sont requis",
        400,
      );
    }

    console.log("[onboarding/create-organisation] step=create_organization_from_deal", {
      deal_id,
      company_name,
      drh_email,
    });

    const result = await createOrganizationFromDeal(service, {
      company_name,
      drh_email,
      drh_name,
      estimated_users,
      deal_id,
    });

    console.log("[onboarding/create-organisation] success", {
      organisation_id: result.organisation_id,
    });

    return NextResponse.json({
      success: true,
      organisation: result.organisation,
      organisation_id: result.organisation_id,
    });
  } catch (e) {
    if (e instanceof OnboardingStepError) {
      return errorResponse(
        e.message,
        e.step,
        e.detail,
        e.status ?? 500,
        e.organization_id ? { organization_id: e.organization_id } : undefined,
      );
    }

    const detail = e instanceof Error ? e.message : String(e);
    console.error("[onboarding/create-organisation] unexpected", {
      detail,
      stack: e instanceof Error ? e.stack : undefined,
    });

    return errorResponse(
      "Erreur serveur inattendue",
      "unexpected",
      detail,
      500,
    );
  }
}
