import type { SupabaseClient } from "@supabase/supabase-js";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendOrgTrackedEmail } from "@/lib/email/org-outbound";
import { sendEmail } from "@/lib/email/resend-client";
import {
  buildEdgeEmailShell,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import { loadDossierDocContext } from "@/lib/formation-documents/context";

/** Secours uniquement si aucun chargé de compte n'est assigné. */
const FALLBACK_STAFF_EMAIL = "timmydarcy44@gmail.com";

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#8A8A8A;vertical-align:top;width:160px;">${escapeEdgeEmailHtml(label)}</td>
    <td style="padding:8px 0;font-size:15px;color:#111111;font-weight:500;">${escapeEdgeEmailHtml(value)}</td>
  </tr>`;
}

function profileLabel(profile: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}): string | null {
  return (
    String(profile.full_name ?? "").trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    String(profile.email ?? "").trim().toLowerCase() ||
    null
  );
}

/**
 * Destinataires staff pour les notifs devis/convention :
 * prioritairement le chargé de compte du client.
 */
async function resolveStaffRecipients(
  service: SupabaseClient,
  dossierId: string,
): Promise<{
  emails: string[];
  managerLabel: string | null;
  orgId: string | null;
  hasAccountManager: boolean;
}> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("organization_id, owner_user_id")
    .eq("id", dossierId)
    .maybeSingle();

  const orgId = dossier?.organization_id ? String(dossier.organization_id) : null;
  let managerId: string | null = null;
  if (orgId) {
    const { data: org } = await service
      .from("organizations")
      .select("account_manager_id")
      .eq("id", orgId)
      .maybeSingle();
    managerId = org?.account_manager_id ? String(org.account_manager_id) : null;
  }

  const preferredIds = [managerId, dossier?.owner_user_id ? String(dossier.owner_user_id) : null].filter(
    (id): id is string => Boolean(id),
  );

  let managerLabel: string | null = null;
  let managerEmail: string | null = null;
  let ownerEmail: string | null = null;

  if (preferredIds.length) {
    const { data: profiles } = await service
      .from("profiles")
      .select("id, email, full_name, first_name, last_name")
      .in("id", preferredIds);
    for (const profile of profiles ?? []) {
      const email = String(profile.email ?? "")
        .trim()
        .toLowerCase();
      if (!email.includes("@")) continue;
      if (managerId && String(profile.id) === managerId) {
        managerEmail = email;
        managerLabel = profileLabel(profile);
      } else if (dossier?.owner_user_id && String(profile.id) === String(dossier.owner_user_id)) {
        ownerEmail = email;
      }
    }
  }

  const emails = managerEmail
    ? [managerEmail]
    : ownerEmail
      ? [ownerEmail]
      : [FALLBACK_STAFF_EMAIL];

  return {
    emails,
    managerLabel,
    orgId,
    hasAccountManager: Boolean(managerEmail),
  };
}

/** Informe le chargé de compte qu’un devis / une convention a été accepté(e). */
export async function notifyStaffDocumentAccepted(
  service: SupabaseClient,
  params: {
    dossierId: string;
    kind: "devis" | "convention";
    signedAt: string;
  },
): Promise<void> {
  const ctx = await loadDossierDocContext(service, params.dossierId);
  const { emails, managerLabel, orgId } = await resolveStaffRecipients(service, params.dossierId);

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
        ${managerLabel ? row("Chargé de compte", managerLabel) : ""}
        ${row("Formation", course)}
        ${row("Montant", amount)}
        ${row("Lieu", location)}
        ${contact ? row("Contact", contact) : ""}
        ${row("Accepté le", signedLabel)}
        ${row("Dossier", params.dossierId)}
      </table>`,
    footerNote: "Notification automatique — chargé de compte",
  });

  const subject = `[Byound] ${kindLabel} accepté — ${company} · ${course}`;
  const tags = {
    type: "formation-doc-accepted",
    kind: params.kind,
    dossier_id: params.dossierId,
  };
  const result = orgId
    ? await sendOrgTrackedEmail({
        orgId,
        kind: params.kind === "devis" ? "devis" : "convention",
        label: `${kindLabel} accepté(e) — notif chargé de compte`,
        db: service,
        meta: { dossier_id: params.dossierId, event: "accepted", recipients: emails },
        to: emails,
        skipBcc: true,
        from: EDGE_COCKPIT_FROM,
        subject,
        html,
        tags,
      })
    : await sendEmail({
        to: emails,
        skipBcc: true,
        from: EDGE_COCKPIT_FROM,
        subject,
        html,
        tags,
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
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;background:#0A0B12;border-radius:20px;">
        <tr><td style="padding:18px 20px 8px;">
          <p style="margin:0;font-size:15px;font-weight:800;color:#F3F4FA;letter-spacing:-0.02em;">
            Tutoriel Byound Ready (55 s)
          </p>
          <p style="margin:8px 0 14px;font-size:14px;line-height:1.55;color:#9AA0B5;">
            Avant d'ouvrir votre fiche : comment copier les champs et déposer votre demande OPCO.
          </p>
        </td></tr>
        <tr><td style="padding:0 12px 12px;">
          <!-- Clients compatibles (ex. Apple Mail) : lecture inline -->
          <video
            width="100%"
            height="auto"
            controls
            playsinline
            webkit-playsinline
            preload="metadata"
            style="display:block;width:100%;max-width:100%;border-radius:14px;background:#000;"
          >
            <source src="${escapeEdgeEmailHtml(tutorialUrl)}" type="video/mp4" />
          </video>
          <!-- Fallback Gmail / Outlook : zone cliquable -->
          <!--[if !mso]><!-->
          <a href="${escapeEdgeEmailHtml(tutorialUrl)}" target="_blank" rel="noopener noreferrer"
             style="display:block;margin-top:12px;text-align:center;padding:14px 18px;background:#FF5A00;border-radius:999px;font-size:14px;font-weight:800;color:#FFFFFF;text-decoration:none;letter-spacing:-0.02em;">
            ▶ Lancer le tutoriel
          </a>
          <!--<![endif]-->
          <!--[if mso]>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:12px;"><tr><td align="center" bgcolor="#FF5A00" style="border-radius:999px;">
            <a href="${escapeEdgeEmailHtml(tutorialUrl)}" style="display:inline-block;padding:14px 18px;font-size:14px;font-weight:800;color:#FFFFFF;text-decoration:none;">Lancer le tutoriel</a>
          </td></tr></table>
          <![endif]-->
          <p style="margin:10px 0 4px;font-size:12px;line-height:1.45;color:#6B7288;text-align:center;">
            Si la vidéo ne s'affiche pas dans votre messagerie, utilisez le bouton ci-dessus.
          </p>
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
  const { emails, managerLabel, orgId } = await resolveStaffRecipients(
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
        ${managerLabel ? row("Chargé de compte", managerLabel) : ""}
        ${row("Dossier", params.dossierId)}
      </table>
      <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#111;">
        ${escapeEdgeEmailHtml(params.message)}
      </p>`,
    footerNote: "Notification — demande de modification /doc",
  });

  const subject = `[Byound] Modification devis — ${company} · ${course}`;
  const tags = {
    type: "formation-devis-change-request",
    dossier_id: params.dossierId,
  };
  if (orgId) {
    await sendOrgTrackedEmail({
      orgId,
      kind: "devis",
      label: "Demande de modification devis — notif chargé de compte",
      db: service,
      meta: { dossier_id: params.dossierId, event: "change_request", recipients: emails },
      to: emails,
      skipBcc: true,
      from: EDGE_COCKPIT_FROM,
      subject,
      html,
      tags,
    });
  } else {
    await sendEmail({
      to: emails,
      skipBcc: true,
      from: EDGE_COCKPIT_FROM,
      subject,
      html,
      tags,
    });
  }

  return { emails };
}
