import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BYOUND_COMPANY, companyPostalAddress } from "@/lib/company";
import type { RegistreRow } from "@/lib/handicap/registre-data";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function winAnsi(s: string) {
  return String(s || "")
    .replace(/[\u202f\u00a0\u2009]/g, " ")
    .replace(/[°º]/g, "o")
    .replace(/[·•]/g, "-")
    .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, "");
}

/** Export PDF anonymisé — aucun nom, document ni note. */
export async function buildDisabilityRegistrePdf(rows: RegistreRow[]): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  const pageWidth = 841.89; // A4 landscape
  const pageHeight = 595.28;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawHeader = () => {
    page.drawText(winAnsi(BYOUND_COMPANY.legal_name), {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0.04, 0.06, 0.12),
    });
    y -= 16;
    const siret = BYOUND_COMPANY.siret.replace(
      /(\d{3})(\d{3})(\d{3})(\d{5})/,
      "$1 $2 $3 $4",
    );
    page.drawText(
      winAnsi(
        `${companyPostalAddress()} · SIRET ${siret} · NDA ${BYOUND_COMPANY.nda}`,
      ),
      { x: margin, y, size: 8, font, color: rgb(0.4, 0.42, 0.5) },
    );
    y -= 18;
    page.drawText(winAnsi("Registre Qualiopi — Indicateur 26 (anonymise)"), {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.04, 0.06, 0.12),
    });
    y -= 12;
    page.drawText(
      winAnsi(
        "Donnees anonymisees : besoins, actions et dates — jamais la nature du handicap, ni nom, ni document, ni note.",
      ),
      { x: margin, y, size: 8, font, color: rgb(0.4, 0.42, 0.5) },
    );
    y -= 10;
    page.drawText(
      winAnsi(`Export du ${fmtDate(new Date().toISOString())} · ${rows.length} dossier(s)`),
      { x: margin, y, size: 8, font, color: rgb(0.4, 0.42, 0.5) },
    );
    y -= 20;
  };

  const cols = [
    { label: "Dossier", x: margin, w: 70 },
    { label: "Demande", x: margin + 72, w: 70 },
    { label: "Parcours", x: margin + 145, w: 55 },
    { label: "Amenagements", x: margin + 205, w: 200 },
    { label: "Actions", x: margin + 410, w: 55 },
    { label: "Partenaires", x: margin + 470, w: 160 },
    { label: "Cloture", x: margin + 635, w: 70 },
  ];

  const drawColHeaders = () => {
    for (const c of cols) {
      page.drawText(winAnsi(c.label), {
        x: c.x,
        y,
        size: 8,
        font: fontBold,
        color: rgb(0.25, 0.28, 0.35),
      });
    }
    y -= 14;
    page.drawLine({
      start: { x: margin, y: y + 8 },
      end: { x: pageWidth - margin, y: y + 8 },
      thickness: 0.5,
      color: rgb(0.75, 0.77, 0.82),
    });
  };

  drawHeader();
  drawColHeaders();

  const ensureSpace = (need: number) => {
    if (y - need < margin + 20) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeader();
      drawColHeaders();
    }
  };

  for (const row of rows) {
    const cats = row.accommodationCategories.join(", ") || "—";
    const parts = row.partners.join(", ") || "—";
    const actions =
      row.actionsTotal > 0 ? `${row.actionsDone}/${row.actionsTotal}` : "—";
    ensureSpace(28);

    const cells = [
      { text: row.dossierCode, x: cols[0]!.x },
      { text: fmtDate(row.requestDate), x: cols[1]!.x },
      { text: row.pathType, x: cols[2]!.x },
      { text: cats.slice(0, 48), x: cols[3]!.x },
      { text: actions, x: cols[4]!.x },
      { text: parts.slice(0, 36), x: cols[5]!.x },
      { text: fmtDate(row.closedAt), x: cols[6]!.x },
    ];
    for (const cell of cells) {
      page.drawText(winAnsi(cell.text), {
        x: cell.x,
        y,
        size: 8,
        font,
        color: rgb(0.08, 0.1, 0.16),
      });
    }
    y -= 16;
  }

  if (!rows.length) {
    ensureSpace(20);
    page.drawText(winAnsi("Aucun dossier dans le registre."), {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.42, 0.5),
    });
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
