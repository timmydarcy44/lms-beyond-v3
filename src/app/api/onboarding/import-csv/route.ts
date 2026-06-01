import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { MAX_IMPORT_FILE_BYTES } from "@/lib/onboarding/constants";
import type { ColumnMapping } from "@/lib/onboarding/column-mapping";
import {
  bulkCreateEmployees,
  createEquipesFromDepartments,
} from "@/lib/onboarding/import-employees";
import { parseEmployeeFile, previewStats } from "@/lib/onboarding/parse-file";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function assertOrgAccess(organisationId: string) {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) return { ok: false as const, error: "Non authentifié", status: 401 };

  const isOwner =
    profile?.company_id === organisationId ||
    profile?.role === "admin" ||
    profile?.role_type === "entreprise";

  if (!isOwner) {
    const service = getServiceRoleClient();
    if (service) {
      const { data: org } = await service
        .from("organizations")
        .select("id")
        .eq("id", organisationId)
        .maybeSingle();
      if (!org) return { ok: false as const, error: "Organisation introuvable", status: 404 };
    }
    return { ok: false as const, error: "Accès refusé", status: 403 };
  }
  return { ok: true as const, userId: user.id };
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const organisationId = String(formData.get("organisation_id") ?? "").trim();
  const previewOnly = formData.get("preview") === "1";
  const mappingRaw = formData.get("column_mapping");

  if (!(file instanceof File) || !organisationId) {
    return NextResponse.json({ error: "file et organisation_id requis" }, { status: 400 });
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
  }

  const access = await assertOrgAccess(organisationId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let mapping: ColumnMapping | undefined;
  if (typeof mappingRaw === "string" && mappingRaw) {
    try {
      mapping = JSON.parse(mappingRaw) as ColumnMapping;
    } catch {
      return NextResponse.json({ error: "column_mapping invalide" }, { status: 400 });
    }
  }

  try {
    const { rows, headers, mapping: detected } = await parseEmployeeFile(file, mapping);
    const stats = previewStats(rows);

    if (previewOnly) {
      return NextResponse.json({
        preview: true,
        headers,
        mapping: detected,
        stats,
        sample: rows.filter((r) => !r._skipReason).slice(0, 5),
      });
    }

    const service = getServiceRoleClient();
    if (!service) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const equipes = await createEquipesFromDepartments(
      service,
      stats.departments,
      organisationId,
    );
    const { created, skipped, errors } = await bulkCreateEmployees(
      service,
      rows,
      equipes,
      organisationId,
    );

    await service
      .from("organizations")
      .update({ onboarding_step: "teams_created" })
      .eq("id", organisationId);

    return NextResponse.json({
      equipes_creees: equipes.length,
      employes_importes: created,
      employes_skipped: skipped,
      employes_sans_email: stats.sansEmail,
      equipes,
      errors: errors.length > 0 ? errors : undefined,
      stats,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Import impossible";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
