import { PDFDocument } from "pdf-lib";
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

function moneyPlain(cents: number | null | undefined): string {
  return pdfSafe(eurosFromCents(cents).replace(/\s*€$/, "").trim());
}

function setText(form: ReturnType<PDFDocument["getForm"]>, name: string, value: string) {
  const v = pdfSafe(value);
  if (!v) return;
  try {
    form.getTextField(name).setText(v);
  } catch {
    /* champ absent du modèle */
  }
}

function setCheck(form: ReturnType<PDFDocument["getForm"]>, name: string, on: boolean) {
  try {
    const box = form.getCheckBox(name);
    if (on) box.check();
    else box.uncheck();
  } catch {
    /* champ absent */
  }
}

function conventionRef(ctx: DossierDocContext): string {
  return `BYB-${ctx.dossier.id.slice(0, 8).toUpperCase()}`;
}

function datesLine(ctx: DossierDocContext): string {
  if (!ctx.slots.length) return "a confirmer";
  return [...new Set(ctx.slots.map((s) => formatFrDate(s.slot_date)))].join(" / ");
}

function hoursLine(ctx: DossierDocContext): string {
  const withHours = ctx.slots.filter((s) => s.starts_at && s.ends_at);
  if (!withHours.length) return "selon convocation";
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

  const title =
    ctx.course?.title || ctx.dossier.course_title || ctx.session?.title || "Formation professionnelle";
  const objective =
    ctx.course?.objectives?.[0] ||
    ctx.course?.short_description ||
    "Developper les competences visees par le programme joint.";
  const ref = conventionRef(ctx);
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR");
  const orgName = ctx.organization.name;
  const orgSiret = ctx.organization.siret || "";
  const orgSiren = ctx.organization.siren || (orgSiret ? orgSiret.slice(0, 9) : "");
  const contact = ctx.dossier.contact_name || "";
  const contactLine = [ctx.dossier.contact_email, ctx.dossier.contact_phone]
    .filter(Boolean)
    .join(" · ");
  const location = ctx.session?.location_label || "Selon convocation";
  const audience = ctx.course?.audience?.join(", ") || "Salaries de l'entreprise beneficiaire";
  const prerequisites = ctx.course?.prerequisites || "Aucun prerequis specifique";
  const objectives = ctx.course?.objectives ?? [];
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

  // Couverture
  setText(form, "convention_number", ref);
  setText(form, "established_date", dateStr);
  setText(form, "course_title", title);
  setText(form, "general_objective", objective);
  setText(form, "summary_beneficiary", orgName);
  setText(form, "summary_dates", datesLine(ctx));
  setText(form, "summary_duration", durationLabel(ctx));
  setText(form, "summary_location", location);
  setText(form, "summary_amount_ht", moneyPlain(ctx.dossier.amount_ht_cents));

  // Bénéficiaire
  setText(form, "beneficiary_name", orgName);
  setText(form, "beneficiary_status", "Entreprise");
  setText(form, "beneficiary_address", "");
  setText(form, "beneficiary_siren", orgSiren);
  setText(form, "beneficiary_siret", orgSiret);
  setText(form, "beneficiary_representative", contact);
  setText(form, "beneficiary_contact", contactLine || contact);

  // Objet
  setText(form, "course_title_inline", title);
  setText(form, "beneficiary_name_inline", orgName);
  setText(form, "training_nature", "actions de formation");

  // Caractéristiques
  setText(form, "objective_general", objective);
  setText(form, "audience", audience);
  setText(form, "prerequisites", prerequisites);
  setText(form, "duration", durationLabel(ctx));
  setText(form, "dates", datesLine(ctx));
  setText(form, "hours", hoursLine(ctx));
  setCheck(form, "modality_presentiel", mod === "presentiel");
  setCheck(form, "modality_distanciel", mod === "distanciel");
  setCheck(form, "modality_mixte", mod === "mixte");
  setCheck(form, "modality_individuelle", false);
  setCheck(form, "modality_collective", ctx.participants.length > 0);
  setText(form, "trainees_count", String(ctx.participants.length || ""));
  setText(form, "location", location);
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
  setText(form, "badge_name", title);

  // Financier
  setText(form, "amount_ht", moneyPlain(ctx.dossier.amount_ht_cents));
  setText(form, "vat_rate", tvaRate);
  setText(form, "amount_vat", moneyPlain(ctx.dossier.amount_tva_cents));
  setText(form, "amount_ttc", moneyPlain(ctx.dossier.amount_ttc_cents ?? ctx.dossier.amount_ht_cents));
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
  setText(form, "signed_at_date", dateStr);

  // Annexe
  setText(form, "annex_course_title", title);
  setText(form, "annex_presentation", ctx.course?.short_description || objective);
  setText(form, "annex_duration", durationLabel(ctx));
  setText(form, "annex_format", formatLabel(ctx));
  setText(form, "annex_modules_count", "2");
  setText(form, "annex_evaluation", "Cas pratique + restitution");
  setText(form, "annex_certification", "Attestation + open badge");
  setText(form, "annex_objective", objective);
  setText(form, "annex_audience", audience);
  setText(form, "annex_prerequisites", prerequisites);

  objectives.slice(0, 6).forEach((obj, i) => {
    setText(form, `objective_${i + 1}`, obj);
  });

  // Modules : sans programme structure, on aligne sur les jours / objectifs
  const dayLabels = [...new Set(ctx.slots.map((s) => formatFrDate(s.slot_date)))];
  for (let m = 1; m <= 2; m++) {
    const day = dayLabels[m - 1] || "";
    setText(form, `module_${m}_schedule`, day ? `Jour ${m} · ${day} · ${hoursLine(ctx)}` : "");
    setText(form, `module_${m}_title`, day ? `Module ${m}` : "");
    setText(form, `module_${m}_duration`, day ? "7 h" : "");
    const chunk = objectives.slice((m - 1) * 3, m * 3);
    chunk.forEach((obj, i) => {
      setText(form, `module_${m}_chapter_${i + 1}_title`, `Chapitre ${m}.${i + 1}`);
      setText(form, `module_${m}_chapter_${i + 1}_item_1`, obj);
    });
    setText(
      form,
      `module_${m}_practice`,
      day ? "Mise en situation et cas clients." : "",
    );
    setText(
      form,
      `module_${m}_production`,
      day ? "Plan d'action / livrable de la journee." : "",
    );
  }

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
    setText(form, `final_deliverable_${i + 1}`, obj);
    setText(form, `criterion_${i + 1}`, obj);
    setText(form, `criterion_${i + 1}_expected`, "Acquis");
  });
  setText(form, "trainer_qualifications", "Formateur expert Byound");
  setText(
    form,
    "session_info",
    `${title} — ${datesLine(ctx)} — ${location}`,
  );

  try {
    form.updateFieldAppearances(await pdf.embedFont((await import("pdf-lib")).StandardFonts.Helvetica));
  } catch {
    /* appearances optionnelles */
  }

  // Aplatir pour que le PDF soit figé à l'envoi (lecture universelle)
  try {
    form.flatten();
  } catch {
    /* certains viewers gèrent mieux non aplati */
  }

  const out = await pdf.save();
  return Buffer.from(out);
}
