import { NextRequest, NextResponse } from "next/server";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import {
  EDGE_DPO_CONTACT,
  EDGE_PROCESSING_REGISTER,
  RGPD_REQUEST_LABELS,
  type RgpdRequestType,
} from "@/lib/entreprise/rgpd-register";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_TYPES = new Set<RgpdRequestType>(["access", "erasure", "rectification", "opposition"]);

export async function GET() {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: profile } = await service
    .from("profiles")
    .select("id, first_name, last_name, full_name, email, phone, company_id, role, role_type, created_at")
    .eq("id", access.userId)
    .maybeSingle();

  const orgId =
    "organizationId" in access ? access.organizationId : (profile as { company_id?: string } | null)?.company_id;

  let organisation: { id: string; name: string } | null = null;
  if (orgId) {
    const { data: org } = await service.from("organizations").select("id, name").eq("id", orgId).maybeSingle();
    if (org) organisation = { id: String(org.id), name: String(org.name ?? "") };
  }

  const exportPayload = {
    exported_at: new Date().toISOString(),
    controller: EDGE_DPO_CONTACT,
    processing_register_ids: EDGE_PROCESSING_REGISTER.map((r) => r.id),
    subject: {
      user_id: access.userId,
      email: access.viewer.email,
      first_name: (profile as { first_name?: string | null } | null)?.first_name ?? access.viewer.prenom,
      last_name: (profile as { last_name?: string | null } | null)?.last_name ?? access.viewer.nom,
      phone: (profile as { phone?: string | null } | null)?.phone ?? null,
      role: (profile as { role?: string | null } | null)?.role ?? null,
      role_type: (profile as { role_type?: string | null } | null)?.role_type ?? null,
      created_at: (profile as { created_at?: string | null } | null)?.created_at ?? null,
    },
    organisation,
    rights: {
      access: "Cet export constitue l’exercice du droit d’accès (art. 15 RGPD).",
      erasure: "Vous pouvez demander l’effacement via POST /api/dashboard/entreprise/rgpd { type: erasure }.",
      contact: EDGE_DPO_CONTACT.email,
    },
  };

  // Log access request (best effort)
  await service.from("rgpd_data_requests").insert({
    user_id: access.userId,
    org_id: orgId ?? null,
    request_type: "access",
    status: "fulfilled",
    payload: exportPayload,
    fulfilled_at: new Date().toISOString(),
  });

  return NextResponse.json(exportPayload);
}

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const type = String(body.type ?? "").trim() as RgpdRequestType;
  const notes = String(body.notes ?? "").trim();
  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Type de demande invalide." }, { status: 400 });
  }

  const orgId = "organizationId" in access ? access.organizationId : null;
  const service = getServiceRoleClient();

  let requestId: string | null = null;
  if (service) {
    const { data, error } = await service
      .from("rgpd_data_requests")
      .insert({
        user_id: access.userId,
        org_id: orgId,
        request_type: type,
        status: "pending",
        notes: notes || null,
        payload: {
          viewer: access.viewer,
          requested_at: new Date().toISOString(),
        },
      })
      .select("id")
      .single();

    if (!error && data?.id) requestId = String(data.id);
    else if (error) console.warn("[entreprise/rgpd] insert:", error.message);
  }

  const label = RGPD_REQUEST_LABELS[type];
  const viewerLabel = [access.viewer.prenom, access.viewer.nom].filter(Boolean).join(" ") || access.viewer.email;

  await sendEmail({
    to: EDGE_DPO_CONTACT.email,
    bcc: "timmydarcy44@gmail.com",
    skipBcc: true,
    replyTo: access.viewer.email ?? undefined,
    from: EDGE_COCKPIT_FROM,
    subject: `[RGPD] ${label} — ${viewerLabel}`,
    html: buildEdgeEmailShell({
      title: "Demande RGPD",
      preheader: label,
      bodyHtml: `<p><strong>${escapeEdgeEmailHtml(label)}</strong></p>
        <p>Demandeur : ${escapeEdgeEmailHtml(viewerLabel || "—")}<br/>
        Email : ${escapeEdgeEmailHtml(access.viewer.email || "—")}<br/>
        User ID : ${escapeEdgeEmailHtml(access.userId)}<br/>
        Org ID : ${escapeEdgeEmailHtml(orgId || "—")}<br/>
        Réf. : ${escapeEdgeEmailHtml(requestId || "non persistée")}</p>
        ${notes ? `<p>Notes : ${escapeEdgeEmailHtml(notes)}</p>` : ""}`,
      footerNote: "Demande générée depuis /dashboard/entreprise/compte (droits RGPD).",
    }),
  });

  return NextResponse.json({
    success: true,
    request_id: requestId,
    type,
    message:
      type === "erasure"
        ? "Votre demande d’effacement a été enregistrée. EDGE vous recontacte sous 30 jours."
        : "Votre demande RGPD a été enregistrée. EDGE vous recontacte sous 30 jours.",
  });
}
