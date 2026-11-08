import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, type PDFFont, type PDFTextField } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DossierDocContext } from "@/lib/formation-documents/context";
import { eurosFromCents } from "@/lib/formation-documents/context";
import { fetchVaultTemplatePdf } from "@/lib/formation-documents/vault";
import { assembleConventionPdf } from "@/lib/formation-documents/assemble-convention";
import {
  buildAnnexData,
  renderAnnexPdf,
} from "@/lib/formation-documents/convention-annex";
import {
  formatDateAdmin,
  formatDatesLong,
  formatDatesShort,
  formatDuration,
  formatHours,
  slotsFromDocContext,
} from "@/lib/formation-documents/session-dates";

/** Helvetica / WinAnsi : pas d’espaces fins ni caractères hors plage. */
function pdfSafe(text: string): string {
  return String(text || "")
    .replace(/[\u202f\u00a0\u2009\u2007]/g, " ")
    .replace(/[…]/g, "...")
    .replace(/[–—]/g, "-")
    .replace(/[«»]/g, '"')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00C0-\u00FF]/g, "?")
    .trim();
}

/** Phrase : majuscule en début uniquement, pas de Title Case en milieu. */
function toSentenceCase(text: string): string {
  let s = pdfSafe(text);
  if (!s) return s;
  s = s.toLowerCase();
  s = s.replace(/(^|[.!?]\s+|\n+)(\p{L})/gu, (_, lead: string, letter: string) => {
    return `${lead}${letter.toUpperCase()}`;
  });
  s = s
    .replace(/\bbyound\b/gi, "Byound")
    .replace(/\bopco\b/gi, "OPCO")
    .replace(/\bqualiopi\b/gi, "Qualiopi")
    .replace(/\bsiret\b/gi, "SIRET")
    .replace(/\bsiren\b/gi, "SIREN")
    .replace(/\bht\b/g, "HT")
    .replace(/\bttc\b/g, "TTC")
    .replace(/\btva\b/gi, "TVA")
    .replace(/\bpdf\b/gi, "PDF");
  return s;
}

const SKIP_SENTENCE_CASE = new Set([
  "convention_number",
  "established_date",
  "signed_at_date",
  "beneficiary_siren",
  "beneficiary_siret",
  "summary_amount_ht",
  "amount_ht",
  "amount_vat",
  "amount_ttc",
  "vat_rate",
  "trainees_count",
  "hours",
  "dates",
  "summary_dates",
]);

function moneyPlain(cents: number | null | undefined): string {
  return pdfSafe(eurosFromCents(cents).replace(/\s*€$/, "").trim());
}

function stripFieldBorders(form: ReturnType<PDFDocument["getForm"]>) {
  for (const field of form.getFields()) {
    try {
      for (const widget of field.acroField.getWidgets()) {
        widget.getOrCreateBorderStyle().setWidth(0);
      }
    } catch {
      /* ignore */
    }
  }
}

function fieldBox(field: PDFTextField): { width: number; height: number } {
  try {
    const rect = field.acroField.getWidgets()[0]?.getRectangle();
    if (rect?.width && rect?.height) {
      return {
        width: Math.max(20, rect.width - 6),
        height: Math.max(10, rect.height - 4),
      };
    }
  } catch {
    /* ignore */
  }
  return { width: 220, height: 24 };
}

function estimateWrappedLines(font: PDFFont, text: string, fontSize: number, maxWidth: number): number {
  const width = Math.max(8, maxWidth);
  let total = 0;
  for (const para of text.split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      total += 1;
      continue;
    }
    let lines = 1;
    let lineWidth = 0;
    const space = font.widthOfTextAtSize(" ", fontSize);
    for (const word of words) {
      const w = font.widthOfTextAtSize(word, fontSize);
      const extra = w > width ? Math.ceil(w / width) - 1 : 0;
      if (lineWidth === 0) {
        lineWidth = Math.min(w, width);
        lines += extra;
      } else if (lineWidth + space + w <= width) {
        lineWidth += space + w;
      } else {
        lines += 1 + extra;
        lineWidth = Math.min(w, width);
      }
    }
    total += lines;
  }
  return Math.max(1, total);
}

function fitFontToBox(
  font: PDFFont,
  text: string,
  box: { width: number; height: number },
  maxSize: number,
  minSize = 5.5,
): number {
  let size = maxSize;
  while (size > minSize) {
    const maxLines = Math.max(1, Math.floor(box.height / (size * 1.2)));
    if (estimateWrappedLines(font, text, size, box.width) <= maxLines) return size;
    size -= 0.5;
  }
  return minSize;
}

function truncateToBox(
  font: PDFFont,
  text: string,
  box: { width: number; height: number },
  fontSize: number,
): string {
  const maxLines = Math.max(1, Math.floor(box.height / (fontSize * 1.2)));
  if (estimateWrappedLines(font, text, fontSize, box.width) <= maxLines) return text;
  const ellipsis = "...";
  let low = 0;
  let high = text.length;
  let best = ellipsis;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = `${text.slice(0, mid).trimEnd()}${ellipsis}`;
    if (estimateWrappedLines(font, candidate, fontSize, box.width) <= maxLines) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
}

function defaultMaxFontForField(name: string, boxHeight: number): number {
  if (name === "course_title") return Math.min(18, Math.max(9, boxHeight * 0.7));
  if (boxHeight >= 40) return 10;
  if (boxHeight >= 24) return 9;
  return 8;
}

function fitAndSetTextField(field: PDFTextField, name: string, text: string, font: PDFFont) {
  const box = fieldBox(field);
  const maxSize = defaultMaxFontForField(name, box.height);
  const size = fitFontToBox(font, text, box, maxSize);
  let value = text;
  if (estimateWrappedLines(font, value, size, box.width) > Math.max(1, Math.floor(box.height / (size * 1.2)))) {
    value = truncateToBox(font, value, box, size);
  }
  field.setText(value);
  field.setFontSize(size);
  try {
    if (box.height >= 28 || value.includes("\n")) field.enableMultiline();
  } catch {
    /* ignore */
  }
  field.updateAppearances(font);
}

function setText(
  form: ReturnType<PDFDocument["getForm"]>,
  name: string,
  value: string,
  opts?: { sentenceCase?: boolean },
) {
  const applyCase = opts?.sentenceCase !== false && !SKIP_SENTENCE_CASE.has(name);
  const v = applyCase ? toSentenceCase(value) : pdfSafe(value);
  if (!v) return;
  try {
    const field = form.getTextField(name);
    for (const widget of field.acroField.getWidgets()) {
      widget.getOrCreateBorderStyle().setWidth(0);
    }
    field.setText(v);
  } catch {
    /* champ absent du modèle */
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
    /* champ absent */
  }
}

async function loadInterFonts(pdf: PDFDocument): Promise<{ regular: PDFFont; bold: PDFFont } | null> {
  try {
    pdf.registerFontkit(fontkit);
    const base = path.join(process.cwd(), "public", "fonts");
    const [regularBytes, boldBytes] = await Promise.all([
      readFile(path.join(base, "Inter-Regular.ttf")),
      readFile(path.join(base, "Inter-Bold.ttf")),
    ]);
    const regular = await pdf.embedFont(regularBytes, { subset: true });
    const bold = await pdf.embedFont(boldBytes, { subset: true });
    return { regular, bold };
  } catch (err) {
    console.warn("[fill-convention-vault] Inter fonts unavailable, fallback Helvetica", err);
    return null;
  }
}

function conventionRef(ctx: DossierDocContext): string {
  return `BYB-${ctx.dossier.id.slice(0, 8).toUpperCase()}`;
}

function sessionSlots(ctx: DossierDocContext) {
  return slotsFromDocContext(ctx.slots);
}

function datesCoverLine(ctx: DossierDocContext): string {
  const slots = sessionSlots(ctx);
  return formatDatesShort(slots) || "A confirmer";
}

function datesArticleLine(ctx: DossierDocContext): string {
  const slots = sessionSlots(ctx);
  return formatDatesLong(slots) || "A confirmer";
}

function hoursLine(ctx: DossierDocContext): string {
  return formatHours(sessionSlots(ctx)) || "Selon convocation";
}

function durationLabel(ctx: DossierDocContext): string {
  if (ctx.course?.duration?.trim()) return ctx.course.duration.trim();
  const slots = sessionSlots(ctx);
  return slots.length ? formatDuration(slots) : "A confirmer";
}

function modalityPresence(ctx: DossierDocContext): "presentiel" | "distanciel" | "mixte" | null {
  const m = (ctx.dossier.modality_presence || "").toLowerCase();
  if (m.includes("present")) return "presentiel";
  if (m.includes("distan")) return "distanciel";
  if (m.includes("mixte") || m.includes("hybride")) return "mixte";
  return null;
}

/** Charge le modèle corps (6 pages / 48 champs), prioritaire sur l'ancien vault 10 pages. */
async function loadCorpsTemplate(
  service: SupabaseClient,
  templateBuffer?: Buffer | null,
): Promise<Buffer | null> {
  if (templateBuffer?.length) return templateBuffer;

  const localPath = path.join(
    process.cwd(),
    "assets",
    "formation-docs",
    "Modele_Convention_corps_AcroForm.pdf",
  );
  try {
    const local = await readFile(localPath);
    if (local.length) return local;
  } catch {
    /* pas en local */
  }

  const vault = await fetchVaultTemplatePdf(service, "convention");
  return vault?.buffer ?? null;
}

/**
 * Remplit le corps AcroForm (48 champs) puis assemble l'annexe HTML dynamique.
 */
export async function fillVaultConventionPdf(
  service: SupabaseClient,
  ctx: DossierDocContext,
  templateBuffer?: Buffer | null,
): Promise<Buffer | null> {
  const bytes = await loadCorpsTemplate(service, templateBuffer);
  if (!bytes) return null;

  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = pdf.getForm();
  stripFieldBorders(form);

  const inter = await loadInterFonts(pdf);
  const titleRaw =
    ctx.course?.title || ctx.dossier.course_title || ctx.session?.title || "Formation professionnelle";
  const title = toSentenceCase(titleRaw);
  const objective = toSentenceCase(
    ctx.course?.objectives?.[0] ||
      ctx.course?.short_description ||
      "Developper les competences visees par le programme joint.",
  );
  const ref = conventionRef(ctx);
  const dateStr = formatDateAdmin();
  const orgName = toSentenceCase(ctx.organization.name);
  const orgSiret = ctx.organization.siret || "";
  const orgSiren = ctx.organization.siren || (orgSiret ? orgSiret.slice(0, 9) : "");
  const contact = toSentenceCase(ctx.dossier.contact_name || "");
  const contactLine = [ctx.dossier.contact_email, ctx.dossier.contact_phone]
    .filter(Boolean)
    .join(" · ");
  const location = toSentenceCase(ctx.session?.location_label || "Selon convocation");
  const audience = toSentenceCase(
    ctx.course?.audience?.join(", ") || "Salaries de l'entreprise beneficiaire",
  );
  const prerequisites = toSentenceCase(ctx.course?.prerequisites || "Aucun prerequis specifique");
  const funding = (ctx.dossier.funding_type || "").toLowerCase();
  const mod = modalityPresence(ctx);
  const tvaRate =
    ctx.dossier.amount_ht_cents && ctx.dossier.amount_tva_cents
      ? String(
          Math.round(
            (Number(ctx.dossier.amount_tva_cents) / Number(ctx.dossier.amount_ht_cents)) * 100,
          ),
        )
      : "20";
  const datesCover = datesCoverLine(ctx);
  const datesArticle = datesArticleLine(ctx);

  // Couverture
  setText(form, "convention_number", ref, { sentenceCase: false });
  setText(form, "established_date", dateStr, { sentenceCase: false });
  setText(form, "course_title", title, { sentenceCase: false });
  setText(form, "general_objective", objective, { sentenceCase: false });
  setText(form, "summary_beneficiary", orgName, { sentenceCase: false });
  setText(form, "summary_dates", datesCover, { sentenceCase: false });
  setText(form, "summary_duration", durationLabel(ctx));
  setText(form, "summary_location", location, { sentenceCase: false });
  setText(form, "summary_amount_ht", moneyPlain(ctx.dossier.amount_ht_cents), { sentenceCase: false });

  // Bénéficiaire
  setText(form, "beneficiary_name", orgName, { sentenceCase: false });
  setText(form, "beneficiary_status", "Entreprise");
  setText(form, "beneficiary_address", "");
  setText(form, "beneficiary_siren", orgSiren, { sentenceCase: false });
  setText(form, "beneficiary_siret", orgSiret, { sentenceCase: false });
  setText(form, "beneficiary_representative", contact, { sentenceCase: false });
  setText(form, "beneficiary_contact", contactLine || contact, { sentenceCase: false });

  // Objet
  setText(form, "course_title_inline", title, { sentenceCase: false });
  setText(form, "beneficiary_name_inline", orgName, { sentenceCase: false });
  setText(form, "training_nature", "actions de formation");

  // Caractéristiques
  setText(form, "objective_general", objective, { sentenceCase: false });
  setText(form, "audience", audience, { sentenceCase: false });
  setText(form, "prerequisites", prerequisites, { sentenceCase: false });
  setText(form, "duration", durationLabel(ctx));
  setText(form, "dates", datesArticle, { sentenceCase: false });
  setText(form, "hours", hoursLine(ctx), { sentenceCase: false });
  setCheck(form, "modality_presentiel", mod === "presentiel");
  setCheck(form, "modality_distanciel", mod === "distanciel");
  setCheck(form, "modality_mixte", mod === "mixte");
  setCheck(form, "modality_individuelle", false);
  setCheck(form, "modality_collective", ctx.participants.length > 0);
  setText(form, "trainees_count", String(ctx.participants.length || ""), { sentenceCase: false });
  setText(form, "location", location, { sentenceCase: false });
  setText(form, "trainer_name", "Formateur Byound");

  setText(
    form,
    "methods_text",
    "Apports theoriques, cas pratiques, mises en situation et feedback individuel.",
  );
  setText(
    form,
    "technical_means",
    "Salle equipee, supports pedagogiques numeriques, acces plateforme Byound.",
  );
  setText(
    form,
    "intermediate_evaluation",
    "Exercices et productions intermediaires valides avec le formateur.",
  );
  setText(
    form,
    "final_evaluation",
    "Evaluation finale sur cas pratique et restitution des acquis.",
  );
  setText(form, "badge_name", title, { sentenceCase: false });

  // Financier
  setText(form, "amount_ht", moneyPlain(ctx.dossier.amount_ht_cents), { sentenceCase: false });
  setText(form, "vat_rate", tvaRate, { sentenceCase: false });
  setText(form, "amount_vat", moneyPlain(ctx.dossier.amount_tva_cents), { sentenceCase: false });
  setText(form, "amount_ttc", moneyPlain(ctx.dossier.amount_ttc_cents ?? ctx.dossier.amount_ht_cents), {
    sentenceCase: false,
  });
  setCheck(form, "funding_own", funding.includes("entreprise") || funding.includes("propre"));
  setCheck(form, "funding_opco", funding.includes("opco"));
  setCheck(
    form,
    "funding_other",
    Boolean(funding) &&
      !funding.includes("opco") &&
      !funding.includes("entreprise") &&
      !funding.includes("propre"),
  );
  setText(
    form,
    "funding_other_label",
    funding.includes("opco") || funding.includes("entreprise") ? "" : funding,
  );

  // Signature
  setText(form, "signed_at_city", ctx.of.address_city || "Bretteville-sur-Odon");
  setText(form, "signed_at_date", dateStr, { sentenceCase: false });

  // Apparences corps (fit dans les cases)
  try {
    const { StandardFonts } = await import("pdf-lib");
    const fallback = await pdf.embedFont(StandardFonts.Helvetica);
    const regular = inter?.regular ?? fallback;
    const bold = inter?.bold ?? fallback;
    for (const field of form.getFields()) {
      try {
        const name = field.getName();
        const textField = form.getTextField(name);
        const raw = textField.getText() || "";
        if (!raw.trim()) continue;
        fitAndSetTextField(textField, name, raw, name === "course_title" ? bold : regular);
      } catch {
        /* checkbox / non-text */
      }
    }
  } catch {
    /* appearances optionnelles */
  }

  stripFieldBorders(form);
  try {
    form.flatten();
  } catch {
    /* ignore */
  }

  const corpsPdf = Buffer.from(await pdf.save());

  // Annexe HTML dynamique (Section → Chapitre → Sous-chapitre) + assemblage
  try {
    const annexData = buildAnnexData(ctx, ref);
    const annexPdf = await renderAnnexPdf(annexData);
    return assembleConventionPdf({
      corpsPdf,
      annexPdf,
      conventionRef: ref,
      ofFooter: [
        ctx.of.legal_name || "SAS Byound Business",
        [ctx.of.address_line, ctx.of.address_zip, ctx.of.address_city].filter(Boolean).join(", "),
        "contact@byound.fr",
      ]
        .filter(Boolean)
        .join(" · "),
    });
  } catch (err) {
    console.error("[fill-convention-vault] annex/assemble failed, returning corps only", err);
    return corpsPdf;
  }
}
