import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { publicAppUrl } from "@/lib/env";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { OnboardingStepError } from "@/lib/onboarding/onboarding-errors";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

type Role = "admin_hr" | "manager";

type Body = {
  admins?: Array<{ email?: string; full_name?: string; role?: Role }>;
};

function normalizeEmail(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { id: organisationId } = await ctx.params;

  try {
    const { user, profile } = await getCurrentProfileWithAccess();
    if (!user?.id || !profile) {
      return NextResponse.json({ error: "Non authentifié", step: "auth" }, { status: 401 });
    }

    if (!profile.company_id || profile.company_id !== organisationId) {
      return NextResponse.json({ error: "Accès refusé", step: "org_scope" }, { status: 403 });
    }

    const roleType = String(profile.role_type ?? "").toLowerCase();
    if (!["admin_hr", "entreprise", "rh"].includes(roleType)) {
      return NextResponse.json({ error: "Accès réservé au DRH", step: "role" }, { status: 403 });
    }

    const service = getServiceRoleClient();
    if (!service) {
      return NextResponse.json(
        { error: "Service indisponible", step: "service_client", detail: "SUPABASE_SERVICE_ROLE_KEY manquante" },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Body;
    const admins = (body.admins ?? []).map((a) => ({
      email: normalizeEmail(a.email),
      full_name: String(a.full_name ?? "").trim(),
      role: (a.role ?? "admin_hr") as Role,
    }));

    for (const a of admins) {
      if (!a.email || !isValidEmail(a.email)) {
        return NextResponse.json(
          { error: `Email invalide: ${a.email || "—"}`, step: "validate" },
          { status: 400 },
        );
      }
      if (!a.full_name) {
        return NextResponse.json(
          { error: `Nom manquant pour ${a.email}`, step: "validate" },
          { status: 400 },
        );
      }
    }

    const redirectTo = `${publicAppUrl()}/auth/callback?next=${encodeURIComponent("/dashboard/entreprise")}`;

    const invited: Array<{ email: string; status: string; error?: string }> = [];

    for (const admin of admins) {
      try {
        const { data: invite, error: inviteErr } = await service.auth.admin.inviteUserByEmail(admin.email, {
          data: {
            organization_id: organisationId,
            role: admin.role,
            full_name: admin.full_name,
            onboarding_pending: true,
          },
          redirectTo,
        });

        if (inviteErr) {
          invited.push({ email: admin.email, status: "error", error: inviteErr.message });
          continue;
        }

        const userId = invite?.user?.id ?? null;
        if (userId) {
          await service.from("profiles").upsert(
            {
              id: userId,
              email: admin.email,
              full_name: admin.full_name,
              role: "admin",
              role_type: admin.role,
              company_id: organisationId,
            },
            { onConflict: "id" },
          );
          await service.from("org_memberships").upsert(
            { org_id: organisationId, user_id: userId, role: "admin" },
            { onConflict: "org_id,user_id" },
          );
        }

        invited.push({ email: admin.email, status: "invited" });
      } catch (e) {
        invited.push({ email: admin.email, status: "error", error: e instanceof Error ? e.message : String(e) });
      }
    }

    return NextResponse.json({ success: true, invited });
  } catch (e) {
    if (e instanceof OnboardingStepError) {
      return NextResponse.json(
        { error: e.message, step: e.step, detail: e.detail },
        { status: e.status ?? 500 },
      );
    }
    return NextResponse.json(
      { error: "Erreur serveur", step: "unexpected", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

