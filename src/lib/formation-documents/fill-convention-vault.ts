import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, type PDFFont, type PDFTextField } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DossierDocContext } from "@/lib/formation-documents/context";
import { eurosFromCents, formatFrDate } from "@/lib/formation-documents/context";
import { fetchVaultTemplatePdf } from "@/lib/formation-documents/vault";

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
  "annex_modules_count",
  "module_1_duration",
  "module_2_duration",
  "module_3_duration",
  "module_4_duration",
]);

function moneyPlain(cents: number | null | undefined): string {
  return pdfSafe(eurosFromCents(cents).replace(/\s*€$/, "").trim());
}

function stripFieldBorders(form: ReturnType<PDFDocument["getForm"]>) {
  for (const field of form.getFields()) {
    try {
      // Contours AcroForm (souvent perçus comme traits blancs après aplatissement)
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

/** Estime le nombre de lignes si le texte wrappe à maxWidth (sur-estime un peu = plus sûr). */
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

/** Réduit le texte pour qu'il tienne dans la case à la taille donnée (ellipsis). */
function truncateToBox(
  font: PDFFont,
  text: string,
  box: { width: number; height: number },
  fontSize: number,
): string {
  const lineHeight = fontSize * 1.2;
  const maxLines = Math.max(1, Math.floor(box.height / lineHeight));
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
  if (name.includes("item_")) return Math.min(8, Math.max(5.5, boxHeight * 0.55));
  if (name.startsWith("objective_") || name.startsWith("criterion_")) {
    return Math.min(9, Math.max(6, boxHeight * 0.55));
  }
  if (name.includes("chapter_") && name.endsWith("_title")) {
    return Math.min(9, Math.max(6, boxHeight * 0.55));
  }
  if (boxHeight >= 40) return 10;
  if (boxHeight >= 24) return 9;
  return 8;
}

function fitAndSetTextField(field: PDFTextField, name: string, text: string, font: PDFFont) {
  const box = fieldBox(field);
  const maxSize = defaultMaxFontForField(name, box.height);
  let size = fitFontToBox(font, text, box, maxSize);
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

function datesLine(ctx: DossierDocContext): string {
  if (!ctx.slots.length) return "A confirmer";
  return [...new Set(ctx.slots.map((s) => formatFrDate(s.slot_date)))].join(" / ");
}

function hoursLine(ctx: DossierDocContext): string {
  const withHours = ctx.slots.filter((s) => s.starts_at && s.ends_at);
  if (!withHours.length) return "Selon convocation";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
  const morning = withHours.find((s) => s.day_part === "matin");
  const afternoon = withHours.find(
    (s) => s.day_part === "apres_midi" || s.day_part === "après-midi",
  );
  if (morning?.starts_at && morning.ends_at && afternoon?.starts_at && afternoon.ends_at) {
    return `${fmt(morning.starts_at)}-${fmt(morning.ends_at)} / ${fmt(afternoon.starts_at)}-${fmt(afternoon.ends_at)}`;
  }
  const first = withHours[0];
  const last = withHours[withHours.length - 1];
  return `${fmt(first.starts_at!)} - ${fmt(last.ends_at!)}`;
}

function durationLabel(ctx: DossierDocContext): string {
  return ctx.course?.duration || `${Math.max(1, Math.ceil(ctx.slots.length / 2))} jour(s)`;
}

function modalityPresence(ctx: DossierDocContext): "presentiel" | "distanciel" | "mixte" | null {
  const m = (ctx.dossier.modality_presence || "").toLowerCase();
  if (m.includes("present")) return "presentiel";
  if (m.includes("distan")) return "distanciel";
  if (m.includes("mixte") || m.includes("hybride")) return "mixte";
  return null;
}

function formatLabel(ctx: DossierDocContext): string {
  const m = modalityPresence(ctx);
  if (m === "distanciel") return "Distanciel";
  if (m === "mixte") return "Mixte";
  return "Presentiel";
}

/**
 * Remplit le modèle AcroForm du coffre Qualiopi (champs nommés).
 * @param templateBuffer optionnel — pour tests locaux sans passer par le storage
 */
export async function fillVaultConventionPdf(
  service: SupabaseClient,
  ctx: DossierDocContext,
  templateBuffer?: Buffer | null,
): Promise<Buffer | null> {
  let bytes = templateBuffer ?? null;
  if (!bytes) {
    const vault = await fetchVaultTemplatePdf(service, "convention");
    if (!vault) return null;
    bytes = vault.buffer;
  }

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
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR");
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
  const objectives = (ctx.course?.objectives ?? []).map(toSentenceCase);
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
  const datesCover = datesLine(ctx);

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
  setText(form, "dates", datesCover, { sentenceCase: false });
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
    Boolean(funding) && !funding.includes("opco") && !funding.includes("entreprise") && !funding.includes("propre"),
  );
  setText(form, "funding_other_label", funding.includes("opco") || funding.includes("entreprise") ? "" : funding);

  // Signature
  setText(form, "signed_at_city", ctx.of.address_city || "Bretteville-sur-Odon");
  setText(form, "signed_at_date", dateStr, { sentenceCase: false });

  // Annexe
  setText(form, "annex_course_title", title, { sentenceCase: false });
  setText(form, "annex_presentation", ctx.course?.short_description || objective);
  setText(form, "annex_duration", durationLabel(ctx));
  setText(form, "annex_format", formatLabel(ctx));
  setText(form, "annex_modules_count", "2", { sentenceCase: false });
  setText(form, "annex_evaluation", "Cas pratique + restitution");
  setText(form, "annex_certification", "Attestation + open badge");
  setText(form, "annex_objective", objective, { sentenceCase: false });
  setText(form, "annex_audience", audience, { sentenceCase: false });
  setText(form, "annex_prerequisites", prerequisites, { sentenceCase: false });

  objectives.slice(0, 6).forEach((obj, i) => {
    setText(form, `objective_${i + 1}`, obj, { sentenceCase: false });
  });

  // Annexe programme : mapping catalogue → AcroForm
  // Section → module_N | Chapitre → module_N_chapter_M | Sous-chapitre → item_1..3
  // (le modèle PDF affiche encore « Module / Chapitre », mais le contenu suit la nomenclature Byound)
  const dayLabels = [...new Set(ctx.slots.map((s) => formatFrDate(s.slot_date)))];
  const sections = (ctx.course?.program_structure ?? []).slice(0, 4);
  const hours = hoursLine(ctx);
  const sectionCount = sections.length;

  for (let m = 1; m <= 4; m++) {
    const section = sections[m - 1];
    if (!section) continue;

    const sectionTitle = toSentenceCase(section.title);
    const sectionDesc = toSentenceCase(section.description || "");
    const chapters = (section.chapters ?? []).slice(0, 3);

    const dayIdx =
      dayLabels.length <= 1
        ? 0
        : Math.min(
            Math.floor(((m - 1) * dayLabels.length) / Math.max(sectionCount, 1)),
            dayLabels.length - 1,
          );
    const day = dayLabels[dayIdx] || "";
    setText(
      form,
      `module_${m}_schedule`,
      day ? `Jour ${dayIdx + 1} · ${day} · ${hours}` : sectionTitle,
      { sentenceCase: false },
    );
    setText(form, `module_${m}_title`, sectionTitle, { sentenceCase: false });
    // Durée indicative : répartir la journée sur les sections du jour
    const durationHint =
      chapters.length >= 3 ? "3 h 30" : chapters.length === 2 ? "2 h 30" : "1 h 45";
    setText(form, `module_${m}_duration`, durationHint, { sentenceCase: false });

    chapters.forEach((chapter, ci) => {
      const ch = ci + 1;
      setText(form, `module_${m}_chapter_${ch}_title`, toSentenceCase(chapter.title), {
        sentenceCase: false,
      });
      (chapter.subchapters ?? []).slice(0, 3).forEach((sub, si) => {
        setText(
          form,
          `module_${m}_chapter_${ch}_item_${si + 1}`,
          toSentenceCase(sub.title),
          { sentenceCase: false },
        );
      });
    });

    setText(
      form,
      `module_${m}_practice`,
      sectionDesc || "Atelier pratique et mises en situation sur les acquis de la section.",
      { sentenceCase: false },
    );
    setText(
      form,
      `module_${m}_production`,
      "Restitution des acquis et livrable de la section.",
    );
  }
  setText(form, "annex_modules_count", String(sectionCount || 2), { sentenceCase: false });

  setText(form, "lunch_break", "Pause dejeuner selon planning du jour");
  setText(
    form,
    "annex_methods",
    "Alternance theorie / pratique, demos, feedback.",
  );
  setText(
    form,
    "annex_means",
    "Supports PDF, outils collaboratifs, plateforme Byound.",
  );
  setText(form, "final_eval_modality", "Cas pratique + restitution orale");
  objectives.slice(0, 6).forEach((obj, i) => {
    setText(form, `final_deliverable_${i + 1}`, obj, { sentenceCase: false });
    setText(form, `criterion_${i + 1}`, obj, { sentenceCase: false });
    setText(form, `criterion_${i + 1}_expected`, "Acquis");
  });
  setText(form, "trainer_qualifications", "Formateur expert Byound");
  setText(
    form,
    "session_info",
    `${title} — ${datesCover} — ${location}`,
    { sentenceCase: false },
  );

  // Apparences : taille de police + troncature pour rester DANS la case (pas de débordement)
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
        const font = name === "course_title" ? bold : regular;
        fitAndSetTextField(textField, name, raw, font);
      } catch {
        /* checkbox / non-text */
      }
    }
  } catch {
    /* appearances optionnelles */
  }

  stripFieldBorders(form);

  // Aplatir pour que le PDF soit figé à l'envoi (lecture universelle)
  try {
    form.flatten();
  } catch {
    /* certains viewers gèrent mieux non aplati */
  }

  const out = await pdf.save();
  return Buffer.from(out);
}
