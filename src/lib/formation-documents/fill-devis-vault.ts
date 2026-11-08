import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DossierDocContext } from "@/lib/formation-documents/context";
import { formatPostalAddress } from "@/lib/formation-documents/postal-address";
import { assembleQuote } from "@/lib/formation-documents/assemble-quote";
import {
  formatEuroDiscountFromCents,
  formatEuroFromCents,
  renderQuoteDetailPdf,
  type QuoteDetailData,
  type QuoteLine,
} from "@/lib/formation-documents/quote-detail";
import {
  formatDateAdmin,
  formatDatesShort,
  formatDuration,
  formatHours,
  slotsFromDocContext,
} from "@/lib/formation-documents/session-dates";

/** Espaces fins → espace ; conserve Latin-1 + € (U+20AC) pour Inter / WinAnsi. */
function pdfSafe(text: string): string {
  return String(text || "")
    .replace(/[\u202f\u00a0\u2009\u2007]/g, " ")
    .replace(/[…]/g, "...")
    .replace(/[–—]/g, "-")
    .replace(/[«»]/g, '"')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00C0-\u00FF\u20AC]/g, "")
    .trim();
}

async function loadInterFont(pdf: PDFDocument): Promise<PDFFont | null> {
  try {
    pdf.registerFontkit(fontkit);
    const bytes = await readFile(path.join(process.cwd(), "public", "fonts", "Inter-Regular.ttf"));
    return await pdf.embedFont(bytes, { subset: true });
  } catch (err) {
    console.warn("[fill-devis-vault] Inter unavailable, fallback Helvetica", err);
    return null;
  }
}

function setText(
  form: ReturnType<PDFDocument["getForm"]>,
  name: string,
  value: string,
  font?: PDFFont | null,
) {
  const v = pdfSafe(value);
  if (!v) return;
  try {
    const field = form.getTextField(name);
    for (const widget of field.acroField.getWidgets()) {
      widget.getOrCreateBorderStyle().setWidth(0);
    }
    field.setText(v);
    if (font) {
      try {
        field.updateAppearances(font);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* champ absent */
  }
}

function setCheck(form: ReturnType<PDFDocument["getForm"]>, name: string, on: boolean) {
  try {
    const box = form.getCheckBox(name);
    for (const widget of box.acroField.getWidgets()) {
      widget.getOrCreateBorderStyle().setWidth(0);
    }
    if (on) box.check();
    else box.uncheck();
  } catch {
    /* ignore */
  }
}

function modalityLabel(ctx: DossierDocContext): string {
  const parts: string[] = [];
  if (ctx.dossier.modality_intra_inter === "intra") parts.push("Intra-entreprise");
  else if (ctx.dossier.modality_intra_inter === "inter") parts.push("Inter-entreprises");
  const m = (ctx.dossier.modality_presence || "").toLowerCase();
  if (m.includes("distan")) parts.push("distanciel");
  else if (m.includes("mixte") || m.includes("hybride")) parts.push("mixte");
  else parts.push("présentiel");
  return parts.join(" · ");
}

async function loadDevisCorpsTemplate(templateBuffer?: Buffer | null): Promise<Buffer | null> {
  if (templateBuffer?.length) return templateBuffer;
  const localPath = path.join(
    process.cwd(),
    "assets",
    "formation-docs",
    "Devis_corps_AcroForm.pdf",
  );
  try {
    const local = await readFile(localPath);
    if (local.length) return local;
  } catch {
    /* ignore */
  }
  return null;
}

export type BuildQuoteOptions = {
  /** Lignes personnalisées (tests 3 / 16 lignes). Sinon dérivées du dossier. */
  detail?: QuoteDetailData;
  /** Validité en jours (défaut 30). */
  validityDays?: number;
  depositPercent?: number | null;
};

/** Construit QuoteDetailData + montants formatés à partir du dossier. */
export function buildQuoteDetailFromContext(
  ctx: DossierDocContext,
  opts?: { depositPercent?: number | null; discountPercent?: number | null },
): QuoteDetailData {
  const title =
    ctx.course?.title || ctx.dossier.course_title || ctx.session?.title || "Formation professionnelle";
  const quoteNumber = `DEV-${ctx.dossier.id.slice(0, 8).toUpperCase()}`;
  const qty = Math.max(1, ctx.participants.length || 1);
  const ht = Math.max(0, Number(ctx.dossier.amount_ht_cents ?? 0));
  const tva = Math.max(0, Number(ctx.dossier.amount_tva_cents ?? 0));
  const ttc = Math.max(0, Number(ctx.dossier.amount_ttc_cents ?? ht + tva));
  const unit = Math.round(ht / qty);
  const vatRatePct =
    ht > 0 && tva > 0 ? Math.round((tva / ht) * 100) : 20;

  const lines: QuoteLine[] = [
    {
      designation: title,
      description: [
        ctx.dossier.modality_intra_inter === "inter" ? "Formation inter-entreprises" : "Formation",
        ctx.course?.duration || null,
        qty > 1 ? "tarif par participant" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      qty: String(qty),
      unitPriceHt: formatEuroFromCents(unit),
      vatRate: `${vatRatePct} %`,
      totalHt: formatEuroFromCents(ht),
    },
  ];

  let subtotal = ht;
  const discounts: QuoteDetailData["discounts"] = [];
  const discountPct = opts?.discountPercent;
  if (discountPct && discountPct > 0) {
    const discountCents = Math.round(subtotal * (discountPct / 100));
    discounts.push({
      label: `Remise partenaire ${discountPct} %`,
      amount: formatEuroDiscountFromCents(discountCents),
    });
    subtotal -= discountCents;
  }

  const vatCents = Math.round(subtotal * (vatRatePct / 100));
  const totalTtc = subtotal + vatCents;
  // Si pas de remise, coller aux montants dossier
  const useDossierTotals = !discountPct;
  const totalHtStr = formatEuroFromCents(useDossierTotals ? ht : subtotal);
  const totalVatStr = formatEuroFromCents(useDossierTotals ? tva : vatCents);
  const totalTtcStr = formatEuroFromCents(useDossierTotals ? ttc : totalTtc);

  const depositPct = opts?.depositPercent;
  const deposit =
    depositPct && depositPct > 0
      ? {
          label: `Acompte ${depositPct} % à la signature`,
          amount: formatEuroFromCents(
            Math.round((useDossierTotals ? ttc : totalTtc) * (depositPct / 100)),
          ),
        }
      : undefined;

  return {
    title,
    subtitle: `${lines.length} ligne${lines.length > 1 ? "s" : ""}`,
    quoteNumber,
    lines,
    notes:
      "Supports remis au format numérique. Session confirmée selon conditions d'inscription.",
    subtotalHt: formatEuroFromCents(ht),
    discounts: discounts.length ? discounts : undefined,
    totals: {
      totalHt: totalHtStr,
      vatRows: [{ label: `TVA ${vatRatePct} %`, amount: totalVatStr }],
      totalTtc: totalTtcStr,
    },
    deposit,
    ofFooter: [
      ctx.of.legal_name || "SAS Byound Business",
      ctx.of.siret
        ? `SIRET ${ctx.of.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4")}`
        : null,
      ctx.of.vat_intra ? `TVA ${ctx.of.vat_intra}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

/**
 * Remplit le corps AcroForm devis (36 champs) puis assemble le détail HTML.
 */
export async function fillVaultDevisPdf(
  service: SupabaseClient,
  ctx: DossierDocContext,
  opts?: BuildQuoteOptions & { templateBuffer?: Buffer | null },
): Promise<Buffer | null> {
  void service;
  const bytes = await loadDevisCorpsTemplate(opts?.templateBuffer);
  if (!bytes) return null;

  const detail = opts?.detail ?? buildQuoteDetailFromContext(ctx, {
    depositPercent: opts?.depositPercent ?? 30,
  });

  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = pdf.getForm();
  const inter = await loadInterFont(pdf);
  const appearanceFont = inter ?? (await pdf.embedFont(StandardFonts.Helvetica));

  const slots = slotsFromDocContext(ctx.slots);
  const quoteDate = formatDateAdmin();
  const validityDays = opts?.validityDays ?? 30;
  const validUntil = formatDateAdmin(
    new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
  );
  const funding = (ctx.dossier.funding_type || "").toLowerCase();
  const title =
    ctx.course?.title || ctx.dossier.course_title || ctx.session?.title || "Formation professionnelle";

  // Totaux AcroForm = exactement les chaînes du détail
  const totalHt = detail.totals.totalHt;
  const totalTtc = detail.totals.totalTtc;
  const totalVat = detail.totals.vatRows.map((v) => v.amount).join(" + ") || formatEuroFromCents(0);

  setText(form, "quote_number", detail.quoteNumber, appearanceFont);
  setText(form, "course_title", title, appearanceFont);
  setText(form, "quote_date", quoteDate, appearanceFont);
  setText(form, "valid_until", validUntil, appearanceFont);
  setText(
    form,
    "client_reference",
    ctx.organization.client_code || ctx.organization.siret || "",
    appearanceFont,
  );
  setText(form, "total_ttc", totalTtc, appearanceFont);
  setText(form, "total_ht", totalHt, appearanceFont);
  setText(form, "total_vat", totalVat, appearanceFont);
  setText(form, "issuer_contact", "contact@byound.fr", appearanceFont);

  setText(form, "client_name", ctx.organization.name, appearanceFont);
  setText(
    form,
    "client_address",
    formatPostalAddress(ctx.organization),
    appearanceFont,
  );
  setText(form, "client_siret", ctx.organization.siret || "", appearanceFont);
  setText(form, "client_vat_number", "", appearanceFont);
  setText(form, "client_contact_name", ctx.dossier.contact_name || "", appearanceFont);
  setText(
    form,
    "client_contact_details",
    [ctx.dossier.contact_email, ctx.dossier.contact_phone].filter(Boolean).join(" · "),
    appearanceFont,
  );

  setText(form, "session_dates", formatDatesShort(slots) || "À confirmer", appearanceFont);
  setText(
    form,
    "session_duration",
    ctx.course?.duration?.trim() || (slots.length ? formatDuration(slots) : "À confirmer"),
    appearanceFont,
  );
  setText(form, "session_hours", formatHours(slots) || "Selon planning", appearanceFont);
  setText(form, "session_location", ctx.session?.location_label || "Selon convocation", appearanceFont);
  setText(form, "session_modality", modalityLabel(ctx), appearanceFont);
  setText(form, "trainees_count", String(ctx.participants.length || ""), appearanceFont);

  setText(
    form,
    "payment_terms",
    "Règlement par virement à réception de facture, sous 30 jours.",
    appearanceFont,
  );
  setText(form, "deposit_amount", detail.deposit?.amount || "", appearanceFont);
  setText(form, "payment_method", "Virement bancaire", appearanceFont);
  setText(form, "bank_iban", "", appearanceFont);
  setText(form, "bank_bic", "", appearanceFont);

  const isOpco = funding === "opco" || funding.includes("opco") || funding === "subrogation";
  const isOwn =
    !isOpco &&
    (funding === "direct" ||
      funding.includes("entreprise") ||
      funding.includes("propre") ||
      funding.includes("fonds") ||
      !funding);
  setCheck(form, "funding_own", isOwn);
  setCheck(form, "funding_opco", isOpco);
  setCheck(form, "funding_other", Boolean(funding) && !isOpco && !isOwn);
  setText(form, "opco_name", isOpco ? "OPCO" : "", appearanceFont);
  setText(form, "funding_other_label", "", appearanceFont);
  setText(form, "funding_reference", "", appearanceFont);

  setText(form, "accept_name", ctx.dossier.contact_name || "", appearanceFont);
  setText(form, "accept_role", "", appearanceFont);
  setText(form, "accept_city", ctx.of.address_city || "Bretteville-sur-Odon", appearanceFont);
  setText(form, "accept_date", quoteDate, appearanceFont);

  try {
    form.updateFieldAppearances(appearanceFont);
  } catch {
    /* ignore */
  }
  try {
    form.flatten();
  } catch {
    /* ignore */
  }

  const corpsPdf = Buffer.from(await pdf.save());
  const detailPdf = await renderQuoteDetailPdf(detail);
  return assembleQuote({
    corpsPdf,
    detailPdf,
    quoteNumber: detail.quoteNumber,
    ofFooter: detail.ofFooter,
  });
}

/** Jeu de démo 3 lignes (aligné Exemple_devis_assemble.pdf). */
export function buildDemoQuoteDetail3Lines(base?: Partial<QuoteDetailData>): QuoteDetailData {
  const lines: QuoteLine[] = [
    {
      designation: "Account management et fidélisation",
      description: "Formation inter-entreprises · 14 h · tarif par participant",
      qty: "2",
      unitPriceHt: formatEuroFromCents(249000),
      vatRate: "20 %",
      totalHt: formatEuroFromCents(498000),
    },
    {
      designation: "Test de positionnement Byound",
      description: "Diagnostic préalable · inclus",
      qty: "2",
      unitPriceHt: formatEuroFromCents(0),
      vatRate: "20 %",
      totalHt: formatEuroFromCents(0),
    },
    {
      designation: "Open Badge « Expert en Account Management »",
      description: "Délivré après validation des compétences · inclus",
      qty: "2",
      unitPriceHt: formatEuroFromCents(0),
      vatRate: "20 %",
      totalHt: formatEuroFromCents(0),
    },
  ];
  return {
    title: "Account management et fidélisation",
    subtitle: "3 lignes",
    quoteNumber: "DEV-2026-0042",
    lines,
    notes:
      "Supports remis au format numérique. Session confirmée à partir de 4 inscrits.",
    subtotalHt: formatEuroFromCents(498000),
    discounts: [
      {
        label: "Remise partenaire 10 %",
        amount: formatEuroDiscountFromCents(49800),
      },
    ],
    totals: {
      totalHt: formatEuroFromCents(448200),
      vatRows: [{ label: "TVA 20 %", amount: formatEuroFromCents(89640) }],
      totalTtc: formatEuroFromCents(537840),
    },
    deposit: {
      label: "Acompte 30 % à la signature",
      amount: formatEuroFromCents(161352),
    },
    ofFooter:
      "SAS Byound Business · SAS au capital de 5 000 € · SIREN 130 709 058 · TVA FR30130709058",
    ...base,
  };
}

/** Jeu de démo 16 lignes (pagination sans coupure de ligne). */
export function buildDemoQuoteDetail16Lines(): QuoteDetailData {
  const base = buildDemoQuoteDetail3Lines({ subtitle: "16 lignes" });
  const lines: QuoteLine[] = [];
  for (let lot = 1; lot <= 16; lot++) {
    const src = base.lines[(lot - 1) % base.lines.length];
    lines.push({
      ...src,
      designation: `${src.designation} — lot ${lot}`,
    });
  }
  // Pattern 3 lignes : formation payante tous les 1,4,7… → 6 × 4 980 € HT
  const paidLots = [1, 4, 7, 10, 13, 16];
  const ht = paidLots.length * 498000;
  const discount = Math.round(ht * 0.1);
  const after = ht - discount;
  const vat = Math.round(after * 0.2);
  const ttc = after + vat;
  return {
    ...base,
    subtitle: "16 lignes",
    lines,
    subtotalHt: formatEuroFromCents(ht),
    discounts: [
      {
        label: "Remise partenaire 10 %",
        amount: formatEuroDiscountFromCents(discount),
      },
    ],
    totals: {
      totalHt: formatEuroFromCents(after),
      vatRows: [{ label: "TVA 20 %", amount: formatEuroFromCents(vat) }],
      totalTtc: formatEuroFromCents(ttc),
    },
    deposit: {
      label: "Acompte 30 % à la signature",
      amount: formatEuroFromCents(Math.round(ttc * 0.3)),
    },
  };
}
