import { NextRequest, NextResponse } from "next/server";
import { notifyStaffDevisChangeRequest } from "@/lib/formation-documents/notify-acceptance";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ token: string }> };

/** Demande de modification depuis la page publique devis. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { token } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    message?: string;
    contact_name?: string;
    accept_token?: string;
  } | null;

  const message = String(body?.message || "").trim();
  if (message.length < 3) {
    return NextResponse.json({ error: "Message trop court" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "Message trop long" }, { status: 400 });
  }

  const { data: doc } = await service
    .from("formation_documents")
    .select("id, dossier_id, kind, access_token, accept_token, status")
    .eq("access_token", token)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  if (doc.kind !== "devis") {
    return NextResponse.json(
      { error: "Modification réservée aux devis" },
      { status: 400 },
    );
  }

  await service.from("formation_events").insert({
    dossier_id: doc.dossier_id,
    event_type: "devis_change_requested",
    payload: {
      document_id: doc.id,
      message,
      contact_name: body?.contact_name || null,
      via: "public_doc",
    },
  });

  // Activité GRC (org_activity)
  try {
    const { data: dossier } = await service
      .from("formation_dossiers")
      .select("organization_id")
      .eq("id", doc.dossier_id)
      .maybeSingle();
    if (dossier?.organization_id) {
      await service.from("org_activity").insert({
        org_id: dossier.organization_id,
        actor_type: "client",
        action: "devis_change_request",
        payload: {
          dossier_id: doc.dossier_id,
          document_id: doc.id,
          message: message.slice(0, 500),
          contact_name: body?.contact_name || null,
        },
      });
    }
  } catch {
    /* org_activity optionnelle */
  }

  try {
    await notifyStaffDevisChangeRequest(service, {
      dossierId: String(doc.dossier_id),
      message,
      contactName: body?.contact_name || null,
    });
  } catch (err) {
    console.warn(
      "[request-change] notify:",
      err instanceof Error ? err.message : err,
    );
  }

  return NextResponse.json({ ok: true });
}
