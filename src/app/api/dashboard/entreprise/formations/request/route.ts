import { NextRequest, NextResponse } from "next/server";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import { BUSINESS_TRAINING_ITEMS } from "@/lib/enterprise/business-training-catalog";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CONTACT_TO = "contact@edgebs.fr";
const CONTACT_BCC = "timmydarcy44@gmail.com";

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#8A8A8A;vertical-align:top;width:160px;">${escapeEdgeEmailHtml(label)}</td>
    <td style="padding:8px 0;font-size:15px;color:#111111;font-weight:500;">${escapeEdgeEmailHtml(value).replace(/\n/g, "<br/>")}</td>
  </tr>`;
}

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ error: "Organisation requise" }, { status: 400 });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const trainingId = String(body.training_id ?? "").trim();
  const contactName = String(body.contact_name ?? "").trim();
  const contactEmail = String(body.contact_email ?? "").trim().toLowerCase();
  const contactPhone = String(body.contact_phone ?? "").trim();
  const participants = String(body.participants ?? "").trim();
  const preferredFormat = String(body.preferred_format ?? "").trim();
  const preferredPeriod = String(body.preferred_period ?? "").trim();
  const notes = String(body.notes ?? body.message ?? "").trim();

  if (!trainingId || !contactName || !contactEmail || !participants) {
    return NextResponse.json(
      { error: "Formation, contact et nombre de participants sont requis." },
      { status: 400 },
    );
  }

  if (!contactEmail.includes("@")) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const training = BUSINESS_TRAINING_ITEMS.find((item) => item.id === trainingId);
  if (!training) {
    return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  }

  let companyName = "";
  const service = getServiceRoleClient();
  if (service) {
    const { data: org } = await service
      .from("organizations")
      .select("name")
      .eq("id", access.organizationId)
      .maybeSingle();
    companyName = String(org?.name ?? "").trim();
  }
  if (!companyName) {
    companyName = "Entreprise EDGE";
  }

  const viewerLabel = [access.viewer.prenom, access.viewer.nom].filter(Boolean).join(" ").trim();

  const html = buildEdgeEmailShell({
    title: "Demande de formation entreprise",
    preheader: `${companyName} — ${training.title}`,
    bodyHtml: `
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Une entreprise a demandé une session via le dashboard EDGE.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align:left;">
        ${row("Formation", training.title)}
        ${row("Catégorie", training.category)}
        ${row("Durée / niveau", `${training.duration} · ${training.level}`)}
        ${row("Catalogue", `${training.format} · à partir de ${training.startingPrice}`)}
        ${row("Entreprise", companyName)}
        ${row("Contact", contactName)}
        ${row("Email", contactEmail)}
        ${contactPhone ? row("Téléphone", contactPhone) : ""}
        ${row("Participants", participants)}
        ${preferredFormat ? row("Format souhaité", preferredFormat) : ""}
        ${preferredPeriod ? row("Période souhaitée", preferredPeriod) : ""}
        ${notes ? row("Précisions", notes) : ""}
        ${row("Compte connecté", viewerLabel || access.viewer.email || "—")}
        ${row("Org ID", access.organizationId)}
      </table>`,
    footerNote: "Demande générée depuis /dashboard/entreprise/formations/demander",
  });

  const result = await sendEmail({
    to: CONTACT_TO,
    bcc: CONTACT_BCC,
    skipBcc: true,
    replyTo: contactEmail,
    from: EDGE_COCKPIT_FROM,
    subject: `[EDGE Formations] ${companyName} — ${training.title}`,
    html,
    tags: {
      type: "entreprise-formation-request",
      org_id: access.organizationId,
    },
  });

  if (!result.success) {
    console.error("[entreprise/formations/request] email error:", result.error);
    return NextResponse.json(
      { error: result.error || "Impossible d'envoyer la demande." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
}
