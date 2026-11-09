import type { SupabaseClient } from "@supabase/supabase-js";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import {
  buildEdgeEmailShell,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import { loadDossierDocContext } from "@/lib/formation-documents/context";

const STAFF_TO = "contact@byound.fr";
const STAFF_BCC = "timmydarcy44@gmail.com";

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#8A8A8A;vertical-align:top;width:160px;">${escapeEdgeEmailHtml(label)}</td>
    <td style="padding:8px 0;font-size:15px;color:#111111;font-weight:500;">${escapeEdgeEmailHtml(value)}</td>
  </tr>`;
}

/** Informe l’équipe Byound qu’un devis ou une convention a été accepté(e) en ligne. */
export async function notifyStaffDocumentAccepted(
  service: SupabaseClient,
  params: {
    dossierId: string;
    kind: "devis" | "convention";
    signedAt: string;
  },
): Promise<void> {
  const ctx = await loadDossierDocContext(service, params.dossierId);
  const kindLabel = params.kind === "devis" ? "Devis" : "Convention";
  const company = ctx?.organization.name || "Entreprise";
  const course =
    ctx?.dossier.course_title || ctx?.session?.title || "Formation";
  const contact = [ctx?.dossier.contact_name, ctx?.dossier.contact_email]
    .filter(Boolean)
    .join(" · ");
  const amount =
    ctx?.dossier.amount_ht_cents != null
      ? new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(ctx.dossier.amount_ht_cents / 100) + " HT"
      : "—";
  const location = ctx?.session?.location_label || "—";
  const signedLabel = new Date(params.signedAt).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
  });

  const html = buildEdgeEmailShell({
    title: `${kindLabel} accepté(e)`,
    preheader: `${company} — ${course}`,
    bodyHtml: `
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Un client a accepté ${params.kind === "devis" ? "le devis" : "la convention"} en ligne.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align:left;">
        ${row("Document", kindLabel)}
        ${row("Entreprise", company)}
        ${ctx?.organization.siret ? row("SIRET", ctx.organization.siret) : ""}
        ${row("Formation", course)}
        ${row("Montant", amount)}
        ${row("Lieu", location)}
        ${contact ? row("Contact", contact) : ""}
        ${row("Accepté le", signedLabel)}
        ${row("Dossier", params.dossierId)}
      </table>`,
    footerNote: "Notification automatique — acceptation publique /doc",
  });

  const result = await sendEmail({
    to: STAFF_TO,
    bcc: STAFF_BCC,
    skipBcc: true,
    from: EDGE_COCKPIT_FROM,
    subject: `[Byound] ${kindLabel} accepté — ${company} · ${course}`,
    html,
    tags: {
      type: "formation-doc-accepted",
      kind: params.kind,
      dossier_id: params.dossierId,
    },
  });

  if (!result.success) {
    console.warn("[notify-acceptance]", result.error);
  }
}
