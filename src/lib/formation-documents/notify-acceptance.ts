import type { SupabaseClient } from "@supabase/supabase-js";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import {
  buildEdgeEmailShell,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import { loadDossierDocContext } from "@/lib/formation-documents/context";

const TIMMY_EMAIL = "timmydarcy44@gmail.com";

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#8A8A8A;vertical-align:top;width:160px;">${escapeEdgeEmailHtml(label)}</td>
    <td style="padding:8px 0;font-size:15px;color:#111111;font-weight:500;">${escapeEdgeEmailHtml(value)}</td>
  </tr>`;
}

async function resolveStaffRecipients(
  service: SupabaseClient,
  dossierId: string,
): Promise<{ emails: string[]; managerLabel: string | null }> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("organization_id, owner_user_id")
    .eq("id", dossierId)
    .maybeSingle();

  const userIds = new Set<string>();
  if (dossier?.owner_user_id) userIds.add(String(dossier.owner_user_id));

  let managerId: string | null = null;
  if (dossier?.organization_id) {
    const { data: org } = await service
      .from("organizations")
      .select("account_manager_id")
      .eq("id", dossier.organization_id)
      .maybeSingle();
    managerId = org?.account_manager_id ? String(org.account_manager_id) : null;
    if (managerId) userIds.add(managerId);
  }

  const emails = new Set<string>([TIMMY_EMAIL]);
  let managerLabel: string | null = null;

  if (userIds.size) {
    const { data: profiles } = await service
      .from("profiles")
      .select("id, email, full_name, first_name, last_name")
      .in("id", [...userIds]);
    for (const profile of profiles ?? []) {
      const email = String(profile.email ?? "")
        .trim()
        .toLowerCase();
      if (email.includes("@")) emails.add(email);
      if (managerId && String(profile.id) === managerId) {
        managerLabel =
          String(profile.full_name ?? "").trim() ||
          [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
          email ||
          null;
      }
    }
  }

  return { emails: [...emails], managerLabel };
}

/** Informe Timmy + le gestionnaire du compte qu’un devis / une convention a été accepté(e). */
export async function notifyStaffDocumentAccepted(
  service: SupabaseClient,
  params: {
    dossierId: string;
    kind: "devis" | "convention";
    signedAt: string;
  },
): Promise<void> {
  const ctx = await loadDossierDocContext(service, params.dossierId);
  const { emails, managerLabel } = await resolveStaffRecipients(service, params.dossierId);

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
        ${managerLabel ? row("Gestionnaire", managerLabel) : ""}
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
    to: emails,
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
