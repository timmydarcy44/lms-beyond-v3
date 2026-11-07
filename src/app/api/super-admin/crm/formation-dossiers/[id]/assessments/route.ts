import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isAssessmentKind } from "@/lib/formation-assessments/types";
import { sendAssessmentInvites } from "@/lib/formation-assessments/send";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const { data: attempts } = await service
    .from("formation_assessment_attempts")
    .select(
      "id, participant_id, profile_id, kind, status, score_pct, completed_at, access_token, created_at",
    )
    .eq("dossier_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ attempts: attempts ?? [] });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { kind?: string } | null;
  const kind = String(body?.kind ?? "").trim();
  if (!isAssessmentKind(kind)) {
    return NextResponse.json({ error: "kind invalide" }, { status: 400 });
  }

  const result = await sendAssessmentInvites(service, {
    dossierId: id,
    kind,
    onlyPending: true,
  });

  await service.from("formation_events").insert({
    dossier_id: id,
    event_type: "assessment_invites_sent",
    payload: { kind, sent: result.sent, errors: result.errors },
  });

  return NextResponse.json({ ok: true, ...result });
}
