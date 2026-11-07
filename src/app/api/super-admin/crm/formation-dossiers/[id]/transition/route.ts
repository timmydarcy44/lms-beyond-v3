import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  FORMATION_DOSSIER_STATUSES,
  type FormationDossierStatus,
} from "@/lib/formation-dossier/constants";
import { transitionFormationDossier } from "@/lib/formation-dossier/transition-server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const toStatus = String(body?.to_status ?? "").trim() as FormationDossierStatus;
  if (!FORMATION_DOSSIER_STATUSES.includes(toStatus)) {
    return NextResponse.json({ error: "Statut cible invalide" }, { status: 400 });
  }

  let actorUserId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    actorUserId = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }

  const result = await transitionFormationDossier(service, {
    dossierId: id,
    toStatus,
    motif: body?.motif != null ? String(body.motif) : null,
    actorUserId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message, code: result.code }, { status: 400 });
  }
  return NextResponse.json({ result });
}
