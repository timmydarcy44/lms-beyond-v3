import type { SupabaseClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import { loadDossierDocContext, eurosFromCents } from "@/lib/formation-documents/context";
import { uploadFormationPdf, newDocToken } from "@/lib/formation-documents/storage";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import {
  buildEdgeEmailShell,
  edgeEmailParagraph,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import { appOrigin } from "@/lib/formation-documents/context";

export type IssueInvoiceResult =
  | {
      ok: true;
      billing_document_id: string;
      number: string;
      amount_ht_cents: number;
      amount_ttc_cents: number;
    }
  | { ok: false; error: string; code: string };

async function assertAttendanceClosed(
  service: SupabaseClient,
  sessionId: string | null,
): Promise<{ ok: true } | { ok: false; error: string; code: string }> {
  if (!sessionId) {
    return { ok: false, error: "Session non liée — impossible de vérifier les émargements.", code: "no_session" };
  }
  const { data: slots } = await service
    .from("formation_slots")
    .select("id")
    .eq("session_id", sessionId);
  if (!slots?.length) {
    return { ok: false, error: "Aucun créneau — programmez la session avant facturation.", code: "no_slots" };
  }
  const ids = slots.map((s) => String(s.id));
  const { data: closures } = await service
    .from("attendance_closures")
    .select("slot_id")
    .in("slot_id", ids);
  if ((closures?.length ?? 0) < ids.length) {
    return {
      ok: false,
      error: `Émargements incomplets : ${closures?.length ?? 0}/${ids.length} créneau(x) clôturé(s).`,
      code: "attendance_incomplete",
    };
  }
  return { ok: true };
}

function buildInvoicePdf(params: {
  ctx: NonNullable<Awaited<ReturnType<typeof loadDossierDocContext>>>;
  number: string;
  ht: number;
  tva: number;
  ttc: number;
  bpfLabel: string | null;
}): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const o = params.ctx.of;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(o.legal_name || "Byound", margin, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 100);
  let y = 28;
  for (const line of [
    o.nda ? `NDA ${o.nda}` : null,
    o.siret ? `SIRET ${o.siret}` : null,
    o.vat_intra ? `TVA ${o.vat_intra}` : null,
  ].filter(Boolean) as string[]) {
    doc.text(line, margin, y);
    y += 4.2;
  }
  doc.setTextColor(17, 17, 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Facture", margin, y + 12);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`N° ${params.number}`, margin, y);
  y += 6;
  doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, margin, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Client", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(params.ctx.organization.name, margin, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Prestation", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(params.ctx.dossier.course_title || "Formation professionnelle", margin, y);
  y += 8;
  if (params.bpfLabel) {
    doc.text(`Financeur BPF : ${params.bpfLabel}`, margin, y);
    y += 8;
  }
  doc.text(`Montant HT : ${eurosFromCents(params.ht)}`, margin, y);
  y += 6;
  doc.text(`TVA : ${eurosFromCents(params.tva)}`, margin, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Total TTC : ${eurosFromCents(params.ttc)}`, margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(
    "Facture émise — non modifiable. Correction uniquement par avoir. Stub export électronique 2027 réservé.",
    margin,
    y,
    { maxWidth: 174 },
  );
  return Buffer.from(doc.output("arraybuffer"));
}

const BPF_LABELS: Record<string, string> = {
  entreprises_salaries: "Entreprises pour la formation de leurs salariés",
  opco: "OPCO",
  pouvoirs_publics: "Pouvoirs publics",
  cpf: "CPF",
  particuliers: "Particuliers",
  autres_of: "Autres organismes de formation",
  autres_produits: "Autres produits",
};

/** Émet une facture formation (validation humaine). */
export async function issueFormationInvoice(
  service: SupabaseClient,
  params: { dossierId: string; actorUserId?: string | null },
): Promise<IssueInvoiceResult> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select(
      "id, organization_id, session_id, course_title, amount_ht_cents, amount_tva_cents, amount_ttc_cents, bpf_funder_type, funding_type, contact_email, contact_name, invoice_validated_at",
    )
    .eq("id", params.dossierId)
    .maybeSingle();

  if (!dossier) return { ok: false, error: "Dossier introuvable", code: "not_found" };

  if (dossier.invoice_validated_at) {
    const { data: existing } = await service
      .from("org_billing_documents")
      .select("id, number, amount_ht_cents, amount_ttc_cents")
      .eq("formation_dossier_id", params.dossierId)
      .eq("doc_type", "invoice")
      .maybeSingle();
    if (existing?.number) {
      return {
        ok: true,
        billing_document_id: String(existing.id),
        number: String(existing.number),
        amount_ht_cents: Number(existing.amount_ht_cents),
        amount_ttc_cents: Number(existing.amount_ttc_cents ?? existing.amount_ht_cents),
      };
    }
  }

  const attendance = await assertAttendanceClosed(
    service,
    dossier.session_id ? String(dossier.session_id) : null,
  );
  if (!attendance.ok) return attendance;

  const ht = Math.round(Number(dossier.amount_ht_cents ?? 0));
  if (ht <= 0) {
    return { ok: false, error: "Montant HT manquant sur le dossier.", code: "amount_required" };
  }
  const tva =
    dossier.amount_tva_cents != null
      ? Math.round(Number(dossier.amount_tva_cents))
      : Math.round(ht * 0.2);
  const ttc =
    dossier.amount_ttc_cents != null ? Math.round(Number(dossier.amount_ttc_cents)) : ht + tva;

  const { data: ofRow } = await service
    .from("of_settings")
    .select("id, invoice_prefix, invoice_next_seq")
    .limit(1)
    .maybeSingle();

  const prefix = String(ofRow?.invoice_prefix || "FAC");
  const seq = Number(ofRow?.invoice_next_seq || 1);
  const number = `${prefix}${String(seq).padStart(5, "0")}`;

  if (ofRow?.id) {
    await service
      .from("of_settings")
      .update({ invoice_next_seq: seq + 1, updated_at: new Date().toISOString() })
      .eq("id", ofRow.id);
  }

  const opcoHt =
    dossier.funding_type === "opco" || dossier.bpf_funder_type === "opco" ? ht : 0;

  const { data: billing, error: billErr } = await service
    .from("org_billing_documents")
    .insert({
      org_id: dossier.organization_id,
      doc_type: "invoice",
      number,
      status: "issued",
      issued_at: new Date().toISOString(),
      due_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount_ht_cents: ht,
      amount_tva_cents: tva,
      amount_ttc_cents: ttc,
      sale_type: "formation",
      opco_ht_cents: opcoHt,
      formation_dossier_id: params.dossierId,
      bpf_funder_type: dossier.bpf_funder_type,
      immutable: true,
      e_invoice_export_stub: {
        format: "factur-x-2027",
        status: "reserved",
        note: "Interface export facture électronique 2027 — stub Lot 5",
      },
    })
    .select("id, number")
    .single();

  if (billErr || !billing) {
    return { ok: false, error: billErr?.message || "Création facture impossible", code: "insert_failed" };
  }

  await service.from("org_billing_lines").insert({
    document_id: billing.id,
    label: dossier.course_title || "Formation professionnelle",
    quantity: 1,
    unit_price_ht_cents: ht,
    tva_rate_bps: ht > 0 ? Math.round((tva / ht) * 10000) : 2000,
    amount_ht_cents: ht,
    amount_tva_cents: tva,
    amount_ttc_cents: ttc,
    sort_order: 0,
  });

  const ctx = await loadDossierDocContext(service, params.dossierId);
  if (ctx) {
    const pdf = buildInvoicePdf({
      ctx,
      number,
      ht,
      tva,
      ttc,
      bpfLabel: dossier.bpf_funder_type
        ? BPF_LABELS[String(dossier.bpf_funder_type)] || String(dossier.bpf_funder_type)
        : null,
    });
    const uploaded = await uploadFormationPdf(service, {
      dossierId: params.dossierId,
      kind: "facture",
      buffer: pdf,
    });
    const accessToken = newDocToken();
    await service.from("formation_documents").upsert(
      {
        dossier_id: params.dossierId,
        kind: "facture",
        title: "Facture",
        status: "sent",
        file_url: uploaded?.fileUrl ?? null,
        access_token: accessToken,
        generated_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        last_sent_to: dossier.contact_email || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "dossier_id,kind" },
    );

    if (dossier.contact_email) {
      const viewUrl = `${appOrigin()}/d/${accessToken}`;
      const greeting = dossier.contact_name
        ? `Bonjour ${escapeEdgeEmailHtml(String(dossier.contact_name))},`
        : "Bonjour,";
      const html = buildEdgeEmailShell({
        title: `Facture ${number}`,
        preheader: `Facture ${number} — ${eurosFromCents(ttc)} TTC`,
        bodyHtml: `${edgeEmailParagraph(greeting)}${edgeEmailParagraph(
          `Voici la facture relative à la formation « ${escapeEdgeEmailHtml(String(dossier.course_title || "Formation"))} ».`,
        )}${edgeEmailParagraph(`Montant TTC : ${eurosFromCents(ttc)}.`)}`,
        cta: { label: "Voir la facture", href: viewUrl },
        footerNote: "Facture émise non modifiable. Pour une correction, un avoir sera établi.",
      });
      await sendEmail({
        to: String(dossier.contact_email),
        from: EDGE_COCKPIT_FROM,
        subject: `Facture ${number} — Byound`,
        html,
        attachments: [{ filename: `${number}.pdf`, content: pdf }],
        tags: { type: "formation-invoice", dossier_id: params.dossierId },
      });
    }
  }

  const now = new Date().toISOString();
  await service
    .from("formation_dossiers")
    .update({
      invoice_validated_at: now,
      invoice_validated_by: params.actorUserId ?? null,
      updated_at: now,
    })
    .eq("id", params.dossierId);

  await service
    .from("formation_assignments")
    .update({
      completed_at: now,
      completed_by: params.actorUserId ?? null,
      updated_at: now,
    })
    .eq("dossier_id", params.dossierId)
    .eq("action_key", "facture");

  await service.from("formation_events").insert({
    dossier_id: params.dossierId,
    event_type: "invoice_issued",
    actor_user_id: params.actorUserId ?? null,
    payload: { billing_document_id: billing.id, number },
  });

  return {
    ok: true,
    billing_document_id: String(billing.id),
    number,
    amount_ht_cents: ht,
    amount_ttc_cents: ttc,
  };
}
