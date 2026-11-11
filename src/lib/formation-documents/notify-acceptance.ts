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

/** Confirmation client après acceptation devis + Byound Ready + lien PDF signé. */
export async function notifyClientDevisAccepted(
  service: SupabaseClient,
  params: {
    dossierId: string;
    signedAt: string;
    signerName: string;
    accessToken: string;
    documentId?: string | null;
  },
): Promise<void> {
  const ctx = await loadDossierDocContext(service, params.dossierId);
  const to = ctx?.dossier.contact_email?.trim().toLowerCase();
  if (!to || !to.includes("@")) return;

  const { formationDocumentPublicUrl } = await import(
    "@/lib/formation-documents/public-url"
  );
  const viewUrl = formationDocumentPublicUrl(params.accessToken);
  const company = ctx?.organization.name || "votre entreprise";
  const course =
    ctx?.dossier.course_title || ctx?.session?.title || "votre formation";
  const signedLabel = new Date(params.signedAt).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
  });
  const firstName =
    String(params.signerName || "")
      .trim()
      .split(/\s+/)[0] || "Bonjour";

  let readyUrl: string | null = null;
  try {
    let documentId = params.documentId ? String(params.documentId) : null;
    if (!documentId) {
      const { data: devisDoc } = await service
        .from("formation_documents")
        .select("id")
        .eq("dossier_id", params.dossierId)
        .eq("kind", "devis")
        .maybeSingle();
      documentId = devisDoc?.id ? String(devisDoc.id) : null;
    }
    if (documentId) {
      const { ensureReadyLink } = await import("@/lib/ready/lifecycle");
      const ready = await ensureReadyLink(service, {
        dossierId: params.dossierId,
        documentId,
        recipientEmail: to,
        recipientName: ctx?.dossier.contact_name || params.signerName,
      });
      readyUrl = ready.url;
    }
  } catch (e) {
    console.warn(
      "[notify-client-acceptance] Byound Ready:",
      e instanceof Error ? e.message : e,
    );
  }

  const tutorialUrl = process.env.READY_TUTORIAL_URL?.trim() || null;

  const tutorialBlock = tutorialUrl
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;background:#FFF5F0;border-radius:20px;border:1px solid #FFD4C2;">
        <tr><td style="padding:18px 20px;">
          <p style="margin:0;font-size:15px;font-weight:800;color:#111;letter-spacing:-0.02em;">
            Tutoriel Byound Ready (55 s)
          </p>
          <p style="margin:8px 0 0;font-size:14px;line-height:1.55;color:#4A4A4A;">
            Avant d'ouvrir votre fiche, regardez cette courte vidéo : comment copier les champs et déposer votre demande OPCO.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:14px;">
            <tr><td style="background:#FF5A00;border-radius:999px;">
              <a href="${escapeEdgeEmailHtml(tutorialUrl)}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:800;color:#FFFFFF;text-decoration:none;letter-spacing:-0.02em;">
                ▶ Voir le tutoriel
              </a>
            </td></tr>
          </table>
        </td></tr>
      </table>`
    : "";

  const readyBlock = readyUrl
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;background:#15171E;border-radius:20px;">
        <tr><td style="padding:20px;">
          <p style="margin:0;font-size:15px;font-weight:800;color:#F3F4FA;letter-spacing:-0.02em;">
            Votre fiche Byound Ready
          </p>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.55;color:#9AA0B5;">
            Toutes les infos à copier-coller pour votre demande de prise en charge OPCO — lien sécurisé, accès par code envoyé à cette adresse.
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
            <tr><td align="center" style="background:#FFFFFF;border-radius:999px;">
              <a href="${escapeEdgeEmailHtml(readyUrl)}" target="_blank" rel="noopener noreferrer"
                 style="display:block;padding:14px 22px;font-size:14px;font-weight:800;color:#0A0B12;text-decoration:none;letter-spacing:-0.02em;">
                Ouvrir ma fiche Ready →
              </a>
            </td></tr>
          </table>
        </td></tr>
      </table>`
    : "";

  const html = buildEdgeEmailShell({
    title: "Merci d'avoir accepté le devis",
    preheader: `Confirmation — ${course}`,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Bonjour ${escapeEdgeEmailHtml(firstName)},
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Merci d'avoir accepté le devis pour
        <strong>${escapeEdgeEmailHtml(course)}</strong>
        (${escapeEdgeEmailHtml(company)}) le ${escapeEdgeEmailHtml(signedLabel)}.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        La convention de formation vous sera adressée sous peu. Vous pouvez
        télécharger le devis signé ci-dessous${readyUrl ? ", et préparer votre dossier OPCO avec Byound Ready" : ""}.
      </p>
      ${tutorialBlock}
      ${readyBlock}`,
    cta: { label: "Voir le devis signé", href: viewUrl },
    footerNote:
      "Byound — confirmation d'acceptation. Le lien Ready est personnel : ne le transférez pas.",
  });

  const result = await sendEmail({
    to,
    from: EDGE_COCKPIT_FROM,
    subject: `Merci — devis accepté · ${course}`,
    html,
    tags: {
      type: "formation-devis-client-accepted",
      dossier_id: params.dossierId,
      ready: readyUrl ? "1" : "0",
    },
  });
  if (!result.success) {
    console.warn("[notify-client-acceptance]", result.error);
  }
}

/** Demande de modification devis → chargé de compte. */
export async function notifyStaffDevisChangeRequest(
  service: SupabaseClient,
  params: {
    dossierId: string;
    message: string;
    contactName?: string | null;
  },
): Promise<{ emails: string[] }> {
  const ctx = await loadDossierDocContext(service, params.dossierId);
  const { emails, managerLabel } = await resolveStaffRecipients(
    service,
    params.dossierId,
  );
  const company = ctx?.organization.name || "Entreprise";
  const course =
    ctx?.dossier.course_title || ctx?.session?.title || "Formation";

  const html = buildEdgeEmailShell({
    title: "Demande de modification — devis",
    preheader: `${company} — ${course}`,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Un client demande une modification sur le devis.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${row("Entreprise", company)}
        ${row("Formation", course)}
        ${params.contactName ? row("Contact", params.contactName) : ""}
        ${managerLabel ? row("Gestionnaire", managerLabel) : ""}
        ${row("Dossier", params.dossierId)}
      </table>
      <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#111;">
        ${escapeEdgeEmailHtml(params.message)}
      </p>`,
    footerNote: "Notification — demande de modification /doc",
  });

  await sendEmail({
    to: emails,
    skipBcc: true,
    from: EDGE_COCKPIT_FROM,
    subject: `[Byound] Modification devis — ${company} · ${course}`,
    html,
    tags: {
      type: "formation-devis-change-request",
      dossier_id: params.dossierId,
    },
  });

  return { emails };
}
