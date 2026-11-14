import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  clampScore,
  linkRiskToPaqAction,
  parseRiskStatus,
  updateQualiopiRisk,
} from "@/lib/qualiopi/risks";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  if (body.action === "link_paq") {
    const linked = await linkRiskToPaqAction(service, id);
    if (!linked.ok) return NextResponse.json({ error: linked.error }, { status: 400 });
    const updated = await updateQualiopiRisk(service, id, {});
    return NextResponse.json({
      ok: true,
      action_id: linked.actionId,
      risk: updated.ok ? updated.risk : null,
    });
  }

  const status = body.status != null ? parseRiskStatus(body.status) : undefined;
  if (body.status != null && !status) {
    return NextResponse.json({ error: "status invalide" }, { status: 400 });
  }

  const result = await updateQualiopiRisk(service, id, {
    label: body.label != null ? String(body.label) : undefined,
    cause: body.cause !== undefined ? (body.cause ? String(body.cause) : null) : undefined,
    probability: body.probability != null ? clampScore(body.probability) : undefined,
    severity: body.severity != null ? clampScore(body.severity) : undefined,
    preventive_action:
      body.preventive_action !== undefined
        ? body.preventive_action
          ? String(body.preventive_action)
          : null
        : undefined,
    owner_name:
      body.owner_name !== undefined
        ? body.owner_name
          ? String(body.owner_name)
          : null
        : undefined,
    due_at: body.due_at !== undefined ? (body.due_at ? String(body.due_at) : null) : undefined,
    reviewed_at:
      body.reviewed_at !== undefined
        ? body.reviewed_at
          ? String(body.reviewed_at)
          : null
        : undefined,
    status: status ?? undefined,
    action_id:
      body.action_id !== undefined
        ? body.action_id
          ? String(body.action_id)
          : null
        : undefined,
    reclamation_id:
      body.reclamation_id !== undefined
        ? body.reclamation_id
          ? String(body.reclamation_id)
          : null
        : undefined,
    highlight_id:
      body.highlight_id !== undefined
        ? body.highlight_id
          ? String(body.highlight_id)
          : null
        : undefined,
    notes: body.notes !== undefined ? (body.notes ? String(body.notes) : null) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, risk: result.risk });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const { error } = await service.from("crm_qualiopi_risks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
