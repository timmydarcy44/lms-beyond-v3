import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { DossierDocContext } from "@/lib/formation-documents/context";
import { eurosFromCents, formatFrDate } from "@/lib/formation-documents/context";
import { fetchVaultTemplatePdf } from "@/lib/formation-documents/vault";
import type { SupabaseClient } from "@supabase/supabase-js";

const INK = rgb(0.08, 0.09, 0.12);
const WHITE = rgb(1, 1, 1);

/** Helvetica / WinAnsi : pas d’espaces fins ni d’ellipsis unicode. */
function pdfSafe(text: string): string {
  return String(text || "")
    .replace(/[\u202f\u00a0\u2009\u2007]/g, " ")
    .replace(/[…]/g, "...")
    .replace(/[–—]/g, "-")
    .replace(/[«»]/g, '"')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00C0-\u00FF]/g, "?")
    .trim();
}

function drawText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth?: number,
) {
  const value = pdfSafe(text);
  if (!value) return;
  let drawn = value;
  if (maxWidth) {
    while (drawn.length > 3 && font.widthOfTextAtSize(drawn, size) > maxWidth) {
      drawn = drawn.slice(0, -1);
    }
    if (drawn !== value) drawn = `${drawn.slice(0, -1)}...`;
  }
  page.drawText(drawn, { x, y, size, font, color: INK });
}

function drawWrapped(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  yTop: number,
  size: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  if (!words.length) return;
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  lines.forEach((line, i) => {
    page.drawText(line, { x, y: yTop - i * lineHeight, size, font, color: INK });
  });
}

function cover(page: PDFPage, x: number, y: number, w: number, h: number) {
  page.drawRectangle({ x, y, width: w, height: h, color: WHITE, borderWidth: 0 });
}

function checkBox(page: PDFPage, x: number, y: number) {
  // Croix sur la case ☐ (Helvetica n'a pas de ✓)
  page.drawText("X", { x: x + 1, y: y, size: 9, color: INK });
}

function conventionRef(ctx: DossierDocContext): string {
  return `BYB-${ctx.dossier.id.slice(0, 8).toUpperCase()}`;
}

function datesLine(ctx: DossierDocContext): string {
  if (!ctx.slots.length) return "à confirmer";
  const dates = [...new Set(ctx.slots.map((s) => formatFrDate(s.slot_date)))];
  return dates.join(" · ");
}

function hoursLine(ctx: DossierDocContext): string {
  const withHours = ctx.slots.filter((s) => s.starts_at && s.ends_at);
  if (!withHours.length) return "selon convocation";
  const first = withHours[0];
  const last = withHours[withHours.length - 1];
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
  // Typiquement 9h–12h30 / 13h30–17h — on résume la plage du 1er jour
  const morning = withHours.find((s) => s.day_part === "matin");
  const afternoon = withHours.find((s) => s.day_part === "apres_midi" || s.day_part === "après-midi");
  if (morning?.starts_at && morning.ends_at && afternoon?.starts_at && afternoon.ends_at) {
    return `${fmt(morning.starts_at)}–${fmt(morning.ends_at)} / ${fmt(afternoon.starts_at)}–${fmt(afternoon.ends_at)}`;
  }
  return `${fmt(first.starts_at!)} – ${fmt(last.ends_at!)}`;
}

function durationLabel(ctx: DossierDocContext): string {
  return ctx.course?.duration || `${Math.max(1, Math.ceil(ctx.slots.length / 2))} jour(s)`;
}

function modalityPresence(ctx: DossierDocContext): "presentiel" | "distanciel" | "mixte" | null {
  const m = (ctx.dossier.modality_presence || "").toLowerCase();
  if (m.includes("present") || m === "presentiel") return "presentiel";
  if (m.includes("distan")) return "distanciel";
  if (m.includes("mixte") || m.includes("hybride")) return "mixte";
  return null;
}

/**
 * Remplit le modèle PDF du coffre Qualiopi (zones vierges) avec les données dossier.
 * Pas de génération from scratch : on conserve le design du modèle.
 */
export async function fillVaultConventionPdf(
  service: SupabaseClient,
  ctx: DossierDocContext,
): Promise<Buffer | null> {
  const vault = await fetchVaultTemplatePdf(service, "convention");
  if (!vault) return null;

  const pdf = await PDFDocument.load(vault.buffer, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  if (pages.length < 7) return null;

  const title =
    ctx.course?.title || ctx.dossier.course_title || ctx.session?.title || "Formation professionnelle";
  const objective =
    ctx.course?.objectives?.[0] ||
    ctx.course?.short_description ||
    "Développer les compétences visées par le programme joint.";
  const ref = conventionRef(ctx);
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR");
  const orgName = ctx.organization.name;
  const orgSiret = ctx.organization.siret || "—";
  const orgSiren = ctx.organization.siren || (orgSiret !== "—" ? orgSiret.slice(0, 9) : "—");
  const contact = ctx.dossier.contact_name || "—";
  const contactEmail = ctx.dossier.contact_email || "";
  const location = ctx.session?.location_label || "Selon convocation";
  const ht = eurosFromCents(ctx.dossier.amount_ht_cents);
  const tva = eurosFromCents(ctx.dossier.amount_tva_cents);
  const ttc = eurosFromCents(ctx.dossier.amount_ttc_cents ?? ctx.dossier.amount_ht_cents);
  const tvaRate =
    ctx.dossier.amount_ht_cents && ctx.dossier.amount_tva_cents
      ? Math.round((Number(ctx.dossier.amount_tva_cents) / Number(ctx.dossier.amount_ht_cents)) * 100)
      : 20;
  const audience = ctx.course?.audience?.join(", ") || "Salariés de l'entreprise bénéficiaire";
  const prerequisites = ctx.course?.prerequisites || "Aucun prérequis spécifique";
  const objectives = ctx.course?.objectives ?? [];
  const trainees = String(ctx.participants.length || "—");
  const funding = (ctx.dossier.funding_type || "").toLowerCase();

  // —— Page 1 (couverture) ——
  {
    const p = pages[0];
    cover(p, 458, 782, 120, 12);
    drawText(p, fontBold, `${ref}`, 460, 785.6, 7, 118);
    cover(p, 456, 771, 120, 12);
    drawText(p, font, dateStr, 460, 774.4, 7, 118);
    // Intitulé
    drawWrapped(p, fontBold, title, 56.7, 488, 11, 480, 14, 3);
    // Objectif général
    drawWrapped(p, font, objective, 56.7, 370, 9, 480, 12, 4);
    // Bandeau récap
    drawText(p, font, orgName, 56.7, 92, 7, 90);
    drawText(p, font, datesLine(ctx), 154.9, 92, 6.5, 90);
    drawText(p, font, durationLabel(ctx), 253.1, 92, 7, 90);
    drawText(p, font, location, 351.2, 92, 6.5, 90);
    drawText(p, font, ht, 449.4, 92, 7, 90);
  }

  // —— Page 2 (parties + objet) ——
  {
    const p = pages[1];
    cover(p, 500, 778, 80, 10);
    drawText(p, font, ref, 500, 781.2, 7, 78);

    // Colonne Bénéficiaire (droite)
    drawText(p, fontBold, orgName, 320.6, 672, 9, 220);
    drawWrapped(p, font, "Siège social de l'entreprise", 320.6, 630, 7.5, 220, 10, 2);
    drawText(p, font, orgSiren, 380, 625.1, 7.5, 140);
    drawText(p, font, orgSiret, 380, 603.5, 7.5, 140);
    drawText(p, font, contact, 420, 582, 7.5, 120);
    drawText(p, font, contactEmail || contact, 380, 560.4, 7.5, 160);

    // Titre formation entre guillemets (ligne « … »)
    cover(p, 230, 393, 248, 12);
    drawText(p, fontBold, title, 232, 396.7, 8, 245);
    // « de … »
    cover(p, 158, 379, 150, 12);
    drawText(p, fontBold, orgName, 160, 382.9, 8, 148);
    // Nature (actions de formation)
    cover(p, 152, 345, 145, 12);
    drawText(p, font, "actions de formation", 154, 348.7, 8, 140);
  }

  // —— Page 3 (caractéristiques) ——
  {
    const p = pages[2];
    cover(p, 500, 778, 80, 10);
    drawText(p, font, ref, 500, 781.2, 7, 78);

    drawWrapped(p, font, objective, 144.6, 698, 8, 390, 11, 2);
    drawWrapped(p, font, audience, 144.6, 660, 8, 390, 11, 2);
    drawWrapped(p, font, prerequisites, 144.6, 623, 8, 390, 11, 2);
    drawText(p, fontBold, durationLabel(ctx), 220, 601.4, 8, 300);
    drawWrapped(p, font, datesLine(ctx), 200, 578.7, 8, 340, 10, 2);
    drawText(p, font, hoursLine(ctx), 220, 556, 8, 320);

    const mod = modalityPresence(ctx);
    if (mod === "presentiel") checkBox(p, 292, 532.1);
    if (mod === "distanciel") checkBox(p, 348.2, 532.1);
    if (mod === "mixte") checkBox(p, 403.9, 532.1);
    // Collective
    checkBox(p, 509.7, 532.1);
    cover(p, 455, 515, 80, 12);
    drawText(p, fontBold, trainees, 458, 518.5, 8.4, 70);

    drawWrapped(p, font, location, 200, 495.4, 8, 340, 10, 2);
    drawText(p, font, "Formateur Byound", 220, 472.7, 8, 300);
  }

  // —— Page 4 (financier + badge) ——
  {
    const p = pages[3];
    cover(p, 500, 778, 80, 10);
    drawText(p, font, ref, 500, 781.2, 7, 78);

    // Open badge name
    cover(p, 180, 421, 250, 12);
    drawText(p, fontBold, title, 182, 424.6, 8, 245);

    // Montants — à gauche du « € HT »
    cover(p, 360, 308, 150, 14);
    drawText(p, fontBold, ht.replace(/\s*€$/, "").trim(), 365, 312, 10, 145);

    cover(p, 210, 284, 40, 12);
    drawText(p, fontBold, String(tvaRate), 215, 287.3, 8.4, 35);
    cover(p, 400, 284, 120, 12);
    drawText(p, fontBold, tva.replace(/\s*€$/, "").trim(), 405, 287.3, 8.4, 115);

    if (funding.includes("opco")) checkBox(p, 373.7, 262.8);
    else if (funding.includes("entreprise") || funding.includes("propre")) checkBox(p, 299.5, 262.8);
    else checkBox(p, 415.1, 262.8);

    cover(p, 360, 205, 150, 16);
    drawText(p, fontBold, ttc.replace(/\s*€$/, "").trim(), 365, 210.1, 12, 145);
  }

  // —— Page 6 (signatures) ——
  {
    const p = pages[5];
    cover(p, 500, 778, 80, 10);
    drawText(p, font, ref, 500, 781.2, 7, 78);
    // Fait à …, le …
    cover(p, 250, 755, 100, 12);
    drawText(p, font, ctx.of.address_city || "Rouen", 252, 758.1, 8.4, 95);
    cover(p, 375, 755, 80, 12);
    drawText(p, font, dateStr, 377, 758.1, 8.4, 75);
  }

  // —— Page 7 (annexe programme) ——
  {
    const p = pages[6];
    cover(p, 500, 778, 80, 10);
    drawText(p, font, ref, 500, 781.2, 7, 78);

    drawWrapped(p, fontBold, title, 73.7, 700, 10, 450, 12, 2);
    drawWrapped(
      p,
      font,
      ctx.course?.short_description || objective,
      73.7,
      650,
      8,
      450,
      11,
      3,
    );
    drawText(p, font, durationLabel(ctx), 73.7, 600, 8, 80);
    drawText(
      p,
      font,
      modalityPresence(ctx) === "distanciel"
        ? "Distanciel"
        : modalityPresence(ctx) === "mixte"
          ? "Mixte"
          : "Présentiel",
      163.3,
      600,
      8,
      80,
    );

    drawWrapped(p, font, objective, 56.7, 535, 9, 480, 11, 2);
    drawWrapped(p, font, audience, 56.7, 455, 8, 230, 10, 3);
    drawWrapped(p, font, prerequisites, 311.8, 455, 8, 230, 10, 3);

    const slots = [
      { x: 75, y: 365.8 },
      { x: 325, y: 365.8 },
      { x: 75, y: 334.6 },
      { x: 325, y: 334.6 },
      { x: 75, y: 303.5 },
      { x: 325, y: 303.5 },
    ];
    objectives.slice(0, 6).forEach((obj, i) => {
      const slot = slots[i];
      drawWrapped(p, font, obj, slot.x, slot.y - 2, 7, 200, 9, 2);
    });
  }

  // En-têtes pages restantes
  for (let i = 4; i < pages.length; i++) {
    if (i === 5 || i === 6) continue;
    const p = pages[i];
    cover(p, 500, 778, 80, 10);
    drawText(p, font, ref, 500, 781.2, 7, 78);
  }

  const out = await pdf.save();
  return Buffer.from(out);
}
