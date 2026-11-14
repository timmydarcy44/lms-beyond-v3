import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import type { CatalogueProofFieldId } from "@/lib/training-courses/qualiopi-fiche";

export const dynamic = "force-dynamic";

const FIELD_TO_COLUMN: Partial<Record<CatalogueProofFieldId, string>> = {
  recognition_type: "recognition_type",
  pedagogical_modality: "pedagogical_modality",
  pedagogical_modality_detail: "pedagogical_modality_detail",
  financing_modalities: "financing_modalities",
  duration: "duration",
};

type Body = {
  fieldId: CatalogueProofFieldId;
  courseIds: string[];
  /** Valeur unique (mode « Même valeur pour toutes »). */
  value?: string;
  /** Valeur par thématique (domain). */
  valueByDomain?: Record<string, string>;
  /** Objectifs : une fiche à la fois — liste d’objectifs à écrire si la fiche en a < 3. */
  objectives?: string[];
  preview?: boolean;
};

function isEmptyColumn(raw: unknown): boolean {
  if (raw == null) return true;
  if (typeof raw === "string") return !raw.trim();
  if (Array.isArray(raw)) return raw.filter((x) => String(x).trim()).length === 0;
  return false;
}

/** Remplit en série des champs Qualiopi vides uniquement (jamais d’écrasement). */
export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await request.json()) as Body;
  const fieldId = body.fieldId;
  const courseIds = Array.isArray(body.courseIds) ? body.courseIds.filter(Boolean) : [];
  if (!fieldId || !courseIds.length) {
    return NextResponse.json({ error: "fieldId et courseIds requis" }, { status: 400 });
  }

  const { data: rows, error } = await service
    .from("training_courses")
    .select(
      "id, title, domain, objectives, recognition_type, pedagogical_modality, pedagogical_modality_detail, financing_modalities, duration, intra_price, inter_price, price_on_quote",
    )
    .in("id", courseIds)
    .eq("is_active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const updates: Array<{ id: string; title: string; patch: Record<string, unknown> }> = [];

  for (const row of rows ?? []) {
    const id = String(row.id);
    const title = String(row.title ?? "Formation");
    const domain = String(row.domain ?? "").trim() || "Sans thématique";

    if (fieldId === "objectives") {
      const current = Array.isArray(row.objectives)
        ? row.objectives.map((o) => String(o).trim()).filter(Boolean)
        : [];
      if (current.length >= 3) continue;
      const next = (body.objectives ?? []).map((o) => String(o).trim()).filter(Boolean);
      if (next.length < 3) continue;
      // Ne remplace pas : on complète jusqu’à ≥ 3 en gardant les existants
      const merged = [...current];
      for (const o of next) {
        if (merged.length >= 3) break;
        if (!merged.includes(o)) merged.push(o);
      }
      if (merged.length < 3 || merged.length === current.length) continue;
      updates.push({ id, title, patch: { objectives: merged } });
      continue;
    }

    if (fieldId === "tariff" || fieldId === "accessibility") {
      continue; // pas de saisie en série pour ces champs ici
    }

    const col = FIELD_TO_COLUMN[fieldId];
    if (!col) continue;
    const currentVal = (row as Record<string, unknown>)[col];
    if (!isEmptyColumn(currentVal)) continue;

    let value = "";
    if (body.valueByDomain && Object.keys(body.valueByDomain).length) {
      value = String(body.valueByDomain[domain] ?? body.valueByDomain["*"] ?? "").trim();
    } else {
      value = String(body.value ?? "").trim();
    }
    if (!value) continue;

    updates.push({ id, title, patch: { [col]: value } });
  }

  if (body.preview) {
    return NextResponse.json({
      preview: true,
      willUpdate: updates.length,
      titles: updates.map((u) => u.title),
    });
  }

  let updated = 0;
  const now = new Date().toISOString();
  const proofDate = now.slice(0, 10);
  const auth = await getServerClient();
  const {
    data: { user },
  } = auth ? await auth.auth.getUser() : { data: { user: null } };

  for (const u of updates) {
    const { error: upErr } = await service
      .from("training_courses")
      .update({ ...u.patch, updated_at: now })
      .eq("id", u.id)
      .eq("is_active", true);
    if (upErr) continue;
    updated += 1;

    // Journal : preuve / note sur ind. 1 (best-effort)
    try {
      await service.from("crm_qualiopi_indicator_proofs").insert({
        indicator_id: 1,
        label: `Catalogue · ${fieldId}`,
        comment: `Fiche « ${u.title} » : champ ${fieldId} complété en série${user?.email ? ` par ${user.email}` : ""}.`,
        proof_at: proofDate,
      });
    } catch {
      /* ignore journal failures */
    }

    if (user?.id) {
      try {
        await service.from("dashboard_activity_logs").insert({
          user_id: user.id,
          action_type: "qualiopi_catalogue_bulk_fill",
          summary: `Qualiopi catalogue · ${fieldId} · ${u.title}`,
          entity_type: "training_course",
          entity_id: u.id,
          metadata: { fieldId, patch: u.patch },
        });
      } catch {
        /* ignore */
      }
    }
  }

  return NextResponse.json({ updated, requested: courseIds.length, eligible: updates.length });
}
