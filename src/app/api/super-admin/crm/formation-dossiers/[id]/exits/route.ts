import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  EXIT_DETECTED_VIA,
  EXIT_KINDS,
  EXIT_MOTIF_CODES,
  listDossierExits,
  recordParticipantExit,
  type ExitDetectedVia,
  type ExitKind,
  type ExitMotifCode,
} from "@/lib/formation-dossier/exits";

type Ctx = { params: Promise<{ id: string }> };

async function actorId(): Promise<string | null> {
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    return auth.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const exits = await listDossierExits(service, id);
  return NextResponse.json({ exits });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const participantId = String(body?.participant_id ?? "").trim();
  if (!participantId) {
    return NextResponse.json({ error: "participant_id requis" }, { status: 400 });
  }

  const kindRaw = String(body?.kind ?? "abandon");
  const motifRaw = String(body?.motif_code ?? "autre");
  const viaRaw = body?.detected_via != null ? String(body.detected_via) : null;
  if (!(EXIT_KINDS as readonly string[]).includes(kindRaw)) {
    return NextResponse.json({ error: "kind invalide" }, { status: 400 });
  }
  if (!(EXIT_MOTIF_CODES as readonly string[]).includes(motifRaw)) {
    return NextResponse.json({ error: "motif_code invalide" }, { status: 400 });
  }
  if (viaRaw && !(EXIT_DETECTED_VIA as readonly string[]).includes(viaRaw)) {
    return NextResponse.json({ error: "detected_via invalide" }, { status: 400 });
  }

  const result = await recordParticipantExit(service, {
    dossierId: id,
    participantId,
    exitedAt: body?.exited_at ? String(body.exited_at) : undefined,
    kind: kindRaw as ExitKind,
    motifCode: motifRaw as ExitMotifCode,
    motifDetail: body?.motif_detail ? String(body.motif_detail) : null,
    detectedVia: viaRaw as ExitDetectedVia | null,
    actionsTaken: body?.actions_taken ? String(body.actions_taken) : null,
    actorUserId: await actorId(),
    close: body?.close !== false,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const exits = await listDossierExits(service, id);
  return NextResponse.json({ ok: true, exit: result.exit, exits });
}
