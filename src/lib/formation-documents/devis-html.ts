import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BYOUND_COMPANY,
  assertCompanyReadyForQuote,
  companyPostalAddress,
  mergeOfSettingsIntoCompany,
  type CompanyIdentity,
} from "@/lib/company";
import type { DossierDocContext } from "@/lib/formation-documents/context";
import { formatPostalAddress } from "@/lib/formation-documents/postal-address";
import { formationDocumentPublicUrl } from "@/lib/formation-documents/public-url";
import { buildQuoteDetailFromContext } from "@/lib/formation-documents/fill-devis-vault";
import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";
import {
  formatDateAdmin,
  formatDatesShort,
  formatDuration,
  slotsFromDocContext,
} from "@/lib/formation-documents/session-dates";
import { formatEuro } from "@/lib/money/format-euro";

function esc(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function orPrecise(value: string | null | undefined): string {
  const v = String(value || "").trim();
  return v || "À préciser";
}

function modalityPills(ctx: DossierDocContext): string[] {
  const pills: string[] = [];
  if (ctx.dossier.modality_intra_inter === "intra") pills.push("Intra-entreprise");
  else if (ctx.dossier.modality_intra_inter === "inter") pills.push("Inter-entreprises");
  const m = (ctx.dossier.modality_presence || "").toLowerCase();
  if (m.includes("distan")) pills.push("Distanciel");
  else if (m.includes("mixte") || m.includes("hybride")) pills.push("Hybride");
  else pills.push("Présentiel");
  return pills;
}

function formatSiret(raw: string | null | undefined): string {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length !== 14) return d || "—";
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4");
}

export type DevisHtmlAcceptance = {
  signedAt: string;
  signerName: string;
  signerRole?: string | null;
};

export type DevisHtmlMeta = {
  quoteNumber: string;
  validUntilIso: string;
  issuedAtIso: string;
  company: CompanyIdentity;
  html: string;
};

export function buildDevisHtmlDocument(
  ctx: DossierDocContext,
  opts?: {
    company?: CompanyIdentity;
    validityDays?: number;
    acceptance?: DevisHtmlAcceptance | null;
    publicUrl?: string | null;
    issuedAt?: Date;
  },
): DevisHtmlMeta {
  const company = opts?.company ?? BYOUND_COMPANY;
  assertCompanyReadyForQuote(company);

  const issuedAt = opts?.issuedAt ?? new Date();
  const validityDays = opts?.validityDays ?? 30;
  const validUntil = new Date(issuedAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
  const detail = buildQuoteDetailFromContext(ctx, { depositPercent: 30 });
  const slots = slotsFromDocContext(ctx.slots);
  const title =
    ctx.course?.title || ctx.dossier.course_title || ctx.session?.title || "Formation professionnelle";

  const ht = Math.max(0, Number(ctx.dossier.amount_ht_cents ?? 0));
  const tva = Math.max(0, Number(ctx.dossier.amount_tva_cents ?? 0));
  const ttc = Math.max(0, Number(ctx.dossier.amount_ttc_cents ?? ht + tva));
  const vatRatePct = ht > 0 && tva > 0 ? Math.round((tva / ht) * 100) : null;

  const pills = modalityPills(ctx)
    .map((p) => `<span class="pill">${esc(p)}</span>`)
    .join("");

  const duration = orPrecise(
    ctx.course?.duration?.trim() || (slots.length ? formatDuration(slots) : ""),
  );
  const dates = orPrecise(slots.length ? formatDatesShort(slots) : "");
  const location = orPrecise(ctx.session?.location_label || "");
  const participants =
    ctx.participants.length > 0 ? String(ctx.participants.length) : "À préciser";

  const linesHtml = detail.lines
    .map(
      (line) => `<tr>
      <td>
        <strong>${esc(line.designation)}</strong>
        ${line.description ? `<div class="muted small">${esc(line.description)}</div>` : ""}
      </td>
      <td class="num">${esc(line.qty)}</td>
      <td class="num">${esc(line.unitPriceHt)}</td>
      <td class="num">${esc(line.vatRate)}</td>
      <td class="num">${esc(line.totalHt)}</td>
    </tr>`,
    )
    .join("");

  const acceptanceBox = opts?.acceptance
    ? `<div class="accepted-banner">
        <strong>Accepté le ${esc(formatDateAdmin(new Date(opts.acceptance.signedAt)))}</strong>
        par ${esc(opts.acceptance.signerName)}
        ${opts.acceptance.signerRole ? ` · ${esc(opts.acceptance.signerRole)}` : ""}
      </div>`
    : `<div class="bpa">
        <div class="bpa-title">Bon pour accord</div>
        <div class="bpa-grid">
          <div>Date : _______________</div>
          <div>Nom : _______________</div>
          <div>Signature / cachet</div>
        </div>
      </div>`;

  const qrBlock = opts?.publicUrl
    ? `<div class="online">
        <div class="online-title">Ou acceptez en ligne</div>
        <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&amp;data=${encodeURIComponent(opts.publicUrl)}" alt="QR" />
        <div class="muted small">Scannez pour ouvrir le devis</div>
      </div>`
    : "";

  const funding =
    (ctx.dossier.funding_type || "").toLowerCase().includes("opco") ||
    Boolean(ctx.dossier.opco_name || ctx.organization.opco_name)
      ? `Prise en charge OPCO possible${
          ctx.dossier.opco_name || ctx.organization.opco_name
            ? ` (${esc(ctx.dossier.opco_name || ctx.organization.opco_name || "")})`
            : ""
        }. Byound vous accompagne dans le montage du dossier.`
      : "Prise en charge OPCO possible. Byound vous accompagne dans le montage du dossier si besoin.";

  const html = `
<style>
  * { box-sizing: border-box; }
  body { background: #fff; color: #0A0B12; font-size: 10.5px; line-height: 1.35; }
  .page { padding: 18mm 16mm 14mm; width: 210mm; min-height: 297mm; }
  .row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
  .brand { display: flex; align-items: center; gap: 8px; }
  .logo { width: 28px; height: 28px; border-radius: 8px; background: #6E5BFF; color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .brand-name { font-weight: 800; font-size: 16px; }
  .right { text-align: right; }
  .h-devis { font-size: 30px; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
  .meta { color: #5B6178; margin-top: 4px; }
  .badge { display: inline-block; margin-top: 8px; background: #6E5BFF; color: #fff; border-radius: 999px; padding: 4px 10px; font-size: 10px; font-weight: 700; }
  .hero { margin-top: 16px; border-radius: 20px; padding: 18px 20px; color: #fff;
    background: linear-gradient(135deg, #1A1440 0%, #3A2BA0 45%, #6E5BFF 100%); }
  .hero-label { opacity: 0.85; font-size: 11px; font-weight: 600; }
  .hero-amount { font-size: 46px; font-weight: 800; letter-spacing: -0.03em; margin: 4px 0 6px; }
  .hero-title { font-size: 13px; font-weight: 600; opacity: 0.95; }
  .mini { display: flex; gap: 10px; margin-top: 14px; }
  .mini > div { flex: 1; background: rgba(255,255,255,0.14); border-radius: 12px; padding: 10px 12px; }
  .mini .lbl { font-size: 10px; opacity: 0.8; }
  .mini .val { font-size: 16px; font-weight: 800; margin-top: 2px; }
  .cards { display: flex; gap: 12px; margin-top: 14px; }
  .card { flex: 1; background: #F4F5F8; border-radius: 14px; padding: 12px 14px; }
  .card h3 { margin: 0 0 8px; font-size: 11px; color: #6E5BFF; font-weight: 800; text-transform: none; }
  .card p { margin: 0 0 3px; }
  .section { margin-top: 16px; }
  .section-title { font-size: 13px; font-weight: 800; margin: 0 0 8px; }
  .pills { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0 10px; }
  .pill { background: #EEEAFF; color: #3A2BA0; border-radius: 999px; padding: 3px 9px; font-size: 10px; font-weight: 700; }
  .facts { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .fact { background: #F4F5F8; border-radius: 12px; padding: 10px; }
  .fact .lbl { color: #5B6178; font-size: 9px; font-weight: 700; }
  .fact .val { font-weight: 700; margin-top: 3px; font-size: 11px; }
  .fact .val.empty { color: #9AA0B5; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9px; color: #5B6178; padding: 6px 4px; border-bottom: 1px solid #E4E6EF; }
  td { padding: 8px 4px; border-bottom: 1px solid #EEF0F6; vertical-align: top; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .totals { margin-top: 10px; display: flex; justify-content: flex-end; }
  .totals-box { width: 220px; }
  .totals-box .line { display: flex; justify-content: space-between; padding: 3px 0; }
  .ttc { margin-top: 8px; background: #0A0B12; color: #fff; border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; font-weight: 800; }
  .two { display: flex; gap: 12px; margin-top: 14px; }
  .box { flex: 1; border: 1px solid #E4E6EF; border-radius: 14px; padding: 12px; }
  .box h4 { margin: 0 0 6px; font-size: 11px; font-weight: 800; }
  .muted { color: #5B6178; }
  .small { font-size: 9.5px; }
  .bottom { display: flex; gap: 12px; margin-top: 14px; align-items: stretch; }
  .bpa { flex: 1.2; border: 1.5px dashed #C5C9DA; border-radius: 14px; padding: 12px; }
  .bpa-title { font-weight: 800; margin-bottom: 8px; }
  .bpa-grid { display: grid; gap: 10px; color: #5B6178; }
  .online { flex: 0.8; background: #0A0B12; color: #fff; border-radius: 14px; padding: 12px; text-align: center; }
  .online-title { font-weight: 800; margin-bottom: 8px; }
  .qr { width: 96px; height: 96px; background: #fff; border-radius: 8px; padding: 4px; }
  .accepted-banner { flex: 1; background: #E8FFF3; border: 1px solid #6BE39B; border-radius: 14px; padding: 14px; color: #0A0B12; }
  .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #E4E6EF; display: flex; justify-content: space-between; color: #8A90A5; font-size: 8.5px; }
</style>
<div class="page">
  <div class="row">
    <div class="brand">
      <div class="logo">B</div>
      <div class="brand-name">Byound</div>
    </div>
    <div class="right">
      <p class="h-devis">Devis</p>
      <div class="meta">N° ${esc(detail.quoteNumber)} · émis le ${esc(formatDateAdmin(issuedAt))}</div>
      <div class="badge">Valable jusqu'au ${esc(formatDateAdmin(validUntil))}</div>
    </div>
  </div>

  <div class="hero">
    <div class="hero-label">Montant total TTC</div>
    <div class="hero-amount">${esc(formatEuro(ttc))}</div>
    <div class="hero-title">${esc(title)}</div>
    <div class="mini">
      <div><div class="lbl">Montant HT</div><div class="val">${esc(formatEuro(ht))}</div></div>
      <div><div class="lbl">TVA${vatRatePct != null ? ` ${vatRatePct} %` : ""}</div><div class="val">${esc(formatEuro(tva))}</div></div>
    </div>
  </div>

  <div class="cards">
    <div class="card">
      <h3>Émis par</h3>
      <p><strong>${esc(company.legal_name)}</strong></p>
      <p>${esc(company.legal_form)}</p>
      <p>${esc(companyPostalAddress(company))}</p>
      <p>SIRET ${esc(formatSiret(company.siret))}</p>
      <p>TVA ${esc(company.vat_intra)}</p>
      <p>NDA ${esc(company.nda)}</p>
    </div>
    <div class="card">
      <h3>Pour</h3>
      <p><strong>${esc(ctx.dossier.contact_name || ctx.organization.name)}</strong></p>
      ${
        ctx.dossier.contact_name
          ? `<p>${esc(ctx.organization.name)}</p>`
          : ""
      }
      <p>${esc(formatPostalAddress(ctx.organization) || "—")}</p>
      <p>SIRET ${esc(formatSiret(ctx.organization.siret))}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${esc(title)}</div>
    <div class="pills">${pills}</div>
    <div class="facts">
      <div class="fact"><div class="lbl">Durée</div><div class="val ${duration === "À préciser" ? "empty" : ""}">${esc(duration)}</div></div>
      <div class="fact"><div class="lbl">Dates</div><div class="val ${dates === "À préciser" ? "empty" : ""}">${esc(dates)}</div></div>
      <div class="fact"><div class="lbl">Lieu</div><div class="val ${location === "À préciser" ? "empty" : ""}">${esc(location)}</div></div>
      <div class="fact"><div class="lbl">Participants</div><div class="val ${participants === "À préciser" ? "empty" : ""}">${esc(participants)}</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="num">Qté</th>
          <th class="num">Prix unit. HT</th>
          <th class="num">TVA</th>
          <th class="num">Total HT</th>
        </tr>
      </thead>
      <tbody>${linesHtml}</tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="line"><span class="muted">Total HT</span><span>${esc(detail.totals.totalHt)}</span></div>
        ${detail.totals.vatRows
          .map(
            (r) =>
              `<div class="line"><span class="muted">${esc(r.label)}</span><span>${esc(r.amount)}</span></div>`,
          )
          .join("")}
        <div class="ttc"><span>Total TTC</span><span>${esc(detail.totals.totalTtc)}</span></div>
      </div>
    </div>
  </div>

  <div class="two">
    <div class="box">
      <h4>Financement</h4>
      <p class="muted">${funding}</p>
    </div>
    <div class="box">
      <h4>Conditions</h4>
      <p class="muted">Validité ${validityDays} jours. Acceptation = commande sous réserve de convention de formation. Règlement par virement sous 30 jours à réception de facture.</p>
    </div>
  </div>

  <div class="bottom">
    ${acceptanceBox}
    ${qrBlock}
  </div>

  <div class="footer">
    <div>${esc(company.legal_name)} · SIRET ${esc(formatSiret(company.siret))} · TVA ${esc(company.vat_intra)} · NDA ${esc(company.nda)} · ${esc(companyPostalAddress(company))}</div>
    <div>Page 1 / 1</div>
  </div>
</div>`;

  return {
    quoteNumber: detail.quoteNumber,
    validUntilIso: validUntil.toISOString(),
    issuedAtIso: issuedAt.toISOString(),
    company,
    html,
  };
}

export async function renderNeoBanqueDevisPdf(
  service: SupabaseClient,
  ctx: DossierDocContext,
  opts?: {
    acceptance?: DevisHtmlAcceptance | null;
    accessToken?: string | null;
    acceptToken?: string | null;
    validityDays?: number;
  },
): Promise<{ buffer: Buffer; meta: DevisHtmlMeta; contentHash: string } | null> {
  const { data: ofRow } = await service.from("of_settings").select("*").limit(1).maybeSingle();
  const company = mergeOfSettingsIntoCompany(ofRow as Record<string, unknown> | null);

  let publicUrl: string | null = null;
  if (opts?.accessToken) {
    publicUrl = formationDocumentPublicUrl(
      String(opts.accessToken),
      opts.acceptToken ? String(opts.acceptToken) : null,
    );
  }

  const meta = buildDevisHtmlDocument(ctx, {
    company,
    acceptance: opts?.acceptance,
    publicUrl,
    validityDays: opts?.validityDays,
  });

  try {
    const buffer = await renderHtmlToPdf(meta.html, {
      font: "manrope",
      fullBleed: true,
    });
    const contentHash = createHash("sha256").update(buffer).digest("hex");
    return { buffer, meta, contentHash };
  } catch (err) {
    console.warn(
      "[devis-html] render failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
