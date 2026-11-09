import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, type EmailAttachment } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import {
  CONVENTION_PACK_KINDS,
  isLot4Kind,
  type Lot4DocumentKind,
} from "@/lib/formation-documents/constants";
import { loadDossierDocContext } from "@/lib/formation-documents/context";
import { generateFormationDocuments } from "@/lib/formation-documents/generate";
import { buildFormationDocMail } from "@/lib/formation-documents/mail";
import { buildFormationDocumentPdf } from "@/lib/formation-documents/pdf";
import { scheduleDocRelances } from "@/lib/formation-documents/schedule";
import { formationDocumentPublicUrl } from "@/lib/formation-documents/public-url";
import { resolveFormationPdfBuffer } from "@/lib/formation-documents/vault";

async function pdfAttachment(
  service: SupabaseClient,
  dossierId: string,
  kind: Lot4DocumentKind,
  filename: string,
  participantName?: string | null,
): Promise<EmailAttachment | null> {
  const ctx = await loadDossierDocContext(service, dossierId);
  if (!ctx) return null;
  const { buffer } = await resolveFormationPdfBuffer(service, {
    kind,
    ctx,
    buildFallback: () => buildFormationDocumentPdf({ ctx, kind, participantName }),
  });
  return {
    filename,
    content: buffer,
  };
}

export async function sendFormationDocument(
  service: SupabaseClient,
  params: {
    dossierId: string;
    kind: string;
    to?: string | null;
    actorUserId?: string | null;
  },
): Promise<{ ok: boolean; sent_to?: string[]; error?: string; code?: string }> {
  if (!isLot4Kind(params.kind)) {
    return { ok: false, error: "Type de document non géré", code: "unsupported_kind" };
  }

  const ctx = await loadDossierDocContext(service, params.dossierId);
  if (!ctx) return { ok: false, error: "Dossier introuvable", code: "not_found" };

  // Lot 5 — convocations bloquées sans convention signée
  if (params.kind === "convocation") {
    const { data: convention } = await service
      .from("formation_documents")
      .select("status")
      .eq("dossier_id", params.dossierId)
      .eq("kind", "convention")
      .maybeSingle();
    if (convention?.status !== "signed") {
      return {
        ok: false,
        error: "Convocations impossibles tant que la convention n'est pas signée.",
        code: "convention_required",
      };
    }
  }

  const gen = await generateFormationDocuments(service, {
    dossierId: params.dossierId,
    kinds:
      params.kind === "convention"
        ? ["convention", ...CONVENTION_PACK_KINDS]
        : [params.kind],
    actorUserId: params.actorUserId,
  });
  if (gen.error) return { ok: false, error: gen.error };

  const { data: doc } = await service
    .from("formation_documents")
    .select("*")
    .eq("dossier_id", params.dossierId)
    .eq("kind", params.kind)
    .maybeSingle();
  if (!doc?.access_token) {
    return { ok: false, error: "Document non généré", code: "not_generated" };
  }

  const viewUrl = formationDocumentPublicUrl(
    String(doc.access_token),
    (params.kind === "devis" || params.kind === "convention") && doc.accept_token
      ? String(doc.accept_token)
      : null,
  );
  const courseTitle = ctx.dossier.course_title || ctx.session?.title;
  const sentTo: string[] = [];

  if (params.kind === "convocation") {
    const recipients = ctx.participants.filter((p) => p.email);
    if (!recipients.length) {
      return {
        ok: false,
        error: "Aucun participant avec e-mail — ajoutez des participants avant d'envoyer.",
        code: "no_participants",
      };
    }
    for (const p of recipients) {
      const attachment = await pdfAttachment(
        service,
        params.dossierId,
        "convocation",
        `convocation-${p.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        p.name,
      );
      const mail = buildFormationDocMail({
        kind: "convocation",
        recipientName: p.name,
        courseTitle,
        viewUrl,
        extraParagraphs: [
          "Le jour de la formation, un code salle vous sera annoncé pour émarger depuis votre téléphone.",
        ],
      });
      const result = await sendEmail({
        to: p.email!,
        from: EDGE_COCKPIT_FROM,
        subject: mail.subject,
        html: mail.html,
        attachments: attachment ? [attachment] : undefined,
        tags: {
          type: "formation-doc-convocation",
          dossier_id: params.dossierId,
        },
      });
      if (!result.success) {
        return {
          ok: false,
          error: result.error || `Envoi impossible à ${p.email}`,
          code: "email_failed",
          sent_to: sentTo,
        };
      }
      sentTo.push(p.email!);
    }
  } else if (params.kind === "certificat" || params.kind === "attestation") {
    const recipients = ctx.participants.filter((p) => p.email);
    if (!recipients.length) {
      return {
        ok: false,
        error: "Aucun participant avec e-mail",
        code: "no_participants",
      };
    }
    const { countAttendedHalfDays } = await import(
      "@/lib/formation-assessments/attendance-duration"
    );
    for (const p of recipients) {
      const duration = await countAttendedHalfDays(service, {
        sessionId: ctx.dossier.session_id,
        profileId: p.profile_id,
      });
      const buffer = buildFormationDocumentPdf({
        ctx,
        kind: params.kind,
        participantName: p.name,
        attendedHalfDays: duration.attended,
        plannedHalfDays: duration.planned,
      });
      const attachment = {
        filename: `${params.kind}-${p.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        content: buffer,
      };
      const mail = buildFormationDocMail({
        kind: params.kind,
        recipientName: p.name,
        courseTitle,
        viewUrl,
      });
      const result = await sendEmail({
        to: p.email!,
        from: EDGE_COCKPIT_FROM,
        subject: mail.subject,
        html: mail.html,
        attachments: attachment ? [attachment] : undefined,
        tags: {
          type: `formation-doc-${params.kind}`,
          dossier_id: params.dossierId,
        },
      });
      if (!result.success) {
        return {
          ok: false,
          error: result.error || `Envoi impossible à ${p.email}`,
          code: "email_failed",
          sent_to: sentTo,
        };
      }
      sentTo.push(p.email!);
    }
  } else {
    const to =
      (params.to || ctx.dossier.contact_email || "").trim().toLowerCase() || null;
    if (!to || !to.includes("@")) {
      return {
        ok: false,
        error: "E-mail destinataire manquant (contact du dossier).",
        code: "no_recipient",
      };
    }

    const attachments: EmailAttachment[] = [];
    const main = await pdfAttachment(
      service,
      params.dossierId,
      params.kind,
      `${params.kind}.pdf`,
    );
    if (main) attachments.push(main);

    if (params.kind === "convention") {
      for (const packKind of CONVENTION_PACK_KINDS) {
        const pack = await pdfAttachment(
          service,
          params.dossierId,
          packKind,
          `${packKind}.pdf`,
        );
        if (pack) attachments.push(pack);
      }
    }

    const mail = buildFormationDocMail({
      kind: params.kind,
      recipientName: ctx.dossier.contact_name,
      courseTitle,
      viewUrl,
      organizationName: ctx.organization.name,
      amountHtCents: ctx.dossier.amount_ht_cents,
      amountTvaCents: ctx.dossier.amount_tva_cents,
      amountTtcCents: ctx.dossier.amount_ttc_cents,
      quoteNumber:
        (doc as { quote_number?: string | null }).quote_number ||
        (params.kind === "devis"
          ? `DEV-${String(params.dossierId).replace(/-/g, "").slice(0, 6).toUpperCase()}`
          : null),
      issuedAt: doc.generated_at || doc.sent_at || new Date().toISOString(),
    });
    const result = await sendEmail({
      to,
      from: EDGE_COCKPIT_FROM,
      subject: mail.subject,
      html: mail.html,
      attachments,
      tags: {
        type: `formation-doc-${params.kind}`,
        dossier_id: params.dossierId,
      },
    });
    if (!result.success) {
      return { ok: false, error: result.error || "Envoi e-mail impossible", code: "email_failed" };
    }
    sentTo.push(to);
  }

  const now = new Date().toISOString();
  await service
    .from("formation_documents")
    .update({
      status: doc.status === "signed" ? "signed" : "sent",
      sent_at: now,
      last_sent_to: sentTo.join(", "),
      updated_at: now,
    })
    .eq("id", doc.id);

  if (params.kind === "convention") {
    await service
      .from("formation_documents")
      .update({
        status: "sent",
        sent_at: now,
        last_sent_to: sentTo.join(", "),
        updated_at: now,
      })
      .eq("dossier_id", params.dossierId)
      .in("kind", [...CONVENTION_PACK_KINDS]);
  }

  if ((params.kind === "devis" || params.kind === "convention") && sentTo[0]) {
    await scheduleDocRelances(service, {
      dossierId: params.dossierId,
      kind: params.kind,
      toEmail: sentTo[0],
      documentId: String(doc.id),
    });
  }

  await service.from("formation_events").insert({
    dossier_id: params.dossierId,
    event_type: "document_sent",
    actor_user_id: params.actorUserId ?? null,
    payload: { kind: params.kind, sent_to: sentTo },
  });

  return { ok: true, sent_to: sentTo };
}
