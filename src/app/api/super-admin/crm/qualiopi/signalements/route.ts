import { NextRequest, NextResponse } from "next/server";
import { assertSignalementStaffAccess } from "@/lib/qualiopi/is-signalement-staff";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  createSignalement,
  loadSignalementSettings,
  parseSignalementCategory,
  SIGNALEMENT_STATUS_LABELS,
} from "@/lib/qualiopi/signalements";

export const dynamic = "force-dynamic";

async function actorId(): Promise<string | null> {
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    return auth.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Registre signalements sensibles — référent signalement ou super-admin. */
export async function GET() {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const uid = await actorId();
  const access = await assertSignalementStaffAccess(service, uid);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const settings = await loadSignalementSettings(service);
  const { data, error } = await service
    .from("crm_qualiopi_signalements")
    .select(
      "id, category, subject, description, status, is_anonymous, requester_name, requester_email, audience, dossier_id, received_at, ack_at, in_progress_at, closed_at, response, internal_notes, notified_referent_at",
    )
    .order("received_at", { ascending: false })
    .limit(200);
  if (error) {
    if (/crm_qualiopi_signalements|schema cache|does not exist/i.test(error.message)) {
      return NextResponse.json({
        signalements: [],
        settings,
        status_labels: SIGNALEMENT_STATUS_LABELS,
        migration_required: true,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    signalements: data ?? [],
    settings,
    status_labels: SIGNALEMENT_STATUS_LABELS,
  });
}

/** Création manuelle côté staff. */
export async function POST(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const uid = await actorId();
  const access = await assertSignalementStaffAccess(service, uid);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const category = parseSignalementCategory(body?.category);
  const subject = String(body?.subject ?? "").trim();
  const description = String(body?.description ?? "").trim();
  if (!category) return NextResponse.json({ error: "category invalide" }, { status: 400 });
  if (subject.length < 3) return NextResponse.json({ error: "Objet trop court" }, { status: 400 });
  if (description.length < 10) {
    return NextResponse.json({ error: "Description trop courte" }, { status: 400 });
  }

  const result = await createSignalement(service, {
    category,
    subject,
    description,
    isAnonymous: body?.is_anonymous === true,
    requesterUserId: await actorId(),
    requesterName: body?.requester_name ? String(body.requester_name) : null,
    requesterEmail: body?.requester_email ? String(body.requester_email) : null,
    audience: body?.audience ? String(body.audience) : "autre",
    dossierId: body?.dossier_id ? String(body.dossier_id) : null,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id });
}
