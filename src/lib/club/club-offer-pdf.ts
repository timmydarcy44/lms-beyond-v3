import jsPDF from "jspdf";
import { ESR_LOGO_URL, ESR_PRIMARY } from "@/lib/club-theme";
import {
  contractTypeLabel,
  getClubAdminProfile,
  type ClubAdminProfile,
  type ClubContractType,
} from "@/lib/club/club-admin-profile";

export type ClubOfferPdfLine = {
  label: string;
  price: number | null;
};

export type ClubOfferPdfInput = {
  title: string;
  partnerName?: string;
  lines: ClubOfferPdfLine[];
  totalHt?: number;
  contractType?: ClubContractType;
};

function formatEuro(amount: number) {
  return `${amount.toLocaleString("fr-FR")} EUR`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(ESR_LOGO_URL);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const n = Number.parseInt(value, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export async function downloadClubOfferPdf(input: ClubOfferPdfInput) {
  const admin = getClubAdminProfile();
  const contractType = input.contractType ?? admin.contractType;
  const priced = input.lines.filter((line) => typeof line.price === "number") as Array<{
    label: string;
    price: number;
  }>;
  const included = input.lines.filter((line) => line.price === null);
  const totalHt =
    typeof input.totalHt === "number"
      ? input.totalHt
      : priced.reduce((sum, line) => sum + line.price, 0);
  const applyVat = contractType === "sponsoring" && admin.vatLiable;
  const vatAmount = applyVat ? totalHt * (admin.vatRate / 100) : 0;
  const totalTtc = totalHt + vatAmount;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const [r, g, b] = hexToRgb(ESR_PRIMARY);
  const logo = await loadLogoDataUrl();

  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageW, 28, "F");
  if (logo) {
    try {
      doc.addImage(logo, "PNG", margin, 5, 18, 18);
    } catch {
      /* logo optionnel */
    }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(admin.usageName || admin.associationName || "Club", logo ? margin + 22 : margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    contractType === "mecenat" ? "Proposition de mecenat" : "Proposition de sponsoring",
    logo ? margin + 22 : margin,
    20
  );
  doc.setFont("helvetica", "bold");
  doc.text(new Date().toLocaleDateString("fr-FR"), pageW - margin, 16, { align: "right" });

  let y = 40;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(input.title || "Offre personnalisee", margin, y);
  y += 8;

  if (input.partnerName) {
    doc.setFontSize(11);
    doc.text(`A l'attention de : ${input.partnerName}`, margin, y);
    y += 8;
  }

  y = drawIssuerBlock(doc, admin, contractType, margin, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Prestations", margin, y);
  y += 6;

  doc.setFillColor(245, 240, 241);
  doc.rect(margin, y - 4, pageW - margin * 2, 8, "F");
  doc.setFontSize(8);
  doc.text("Designation", margin + 2, y);
  doc.text("Montant HT", pageW - margin - 2, y, { align: "right" });
  y += 8;

  const rows: ClubOfferPdfLine[] = [
    ...priced,
    ...included.map((line) => ({ label: `${line.label} (INCLUS)`, price: null })),
  ];

  doc.setFont("helvetica", "normal");
  rows.forEach((line) => {
    if (y > pageH - 55) {
      doc.addPage();
      y = 20;
    }
    const amount = typeof line.price === "number" ? formatEuro(line.price) : "INCLUS";
    const wrapped = doc.splitTextToSize(line.label, pageW - margin * 2 - 42);
    doc.text(wrapped, margin + 2, y);
    doc.text(amount, pageW - margin - 2, y, { align: "right" });
    y += Math.max(6, wrapped.length * 5);
  });

  y += 4;
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total HT : ${formatEuro(totalHt)}`, pageW - margin, y, { align: "right" });
  y += 6;
  if (applyVat) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`TVA ${admin.vatRate} % : ${formatEuro(vatAmount)}`, pageW - margin, y, { align: "right" });
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(r, g, b);
    doc.text(`Total TTC : ${formatEuro(totalTtc)}`, pageW - margin, y, { align: "right" });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      contractType === "mecenat"
        ? "Operation de mecenat — hors champ de la TVA (recu fiscal)."
        : "TVA non applicable.",
      pageW - margin,
      y,
      { align: "right" }
    );
  }

  y += 14;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Modalites", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const terms =
    contractType === "mecenat"
      ? [
          "Contrat de mecenat : versement sans contrepartie commerciale disproportionnee.",
          "Un recu fiscal (Cerfa n°11580) pourra etre delivre au donateur.",
          admin.iban ? `Reglement par virement : ${admin.iban}${admin.bic ? ` — BIC ${admin.bic}` : ""}` : "IBAN a renseigner dans l'onglet Administratif.",
        ]
      : [
          "Contrat de sponsoring : visibilite et contreparties commerciales detaillees ci-dessus.",
          applyVat ? `Facture avec TVA ${admin.vatRate} %.` : "Facture hors TVA.",
          admin.iban ? `Reglement par virement : ${admin.iban}${admin.bic ? ` — BIC ${admin.bic}` : ""}` : "IBAN a renseigner dans l'onglet Administratif.",
        ];
  terms.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, pageW - margin * 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5;
  });

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Document genere par Beyond Network — proposition non contractuelle tant qu'elle n'est pas signee.",
    margin,
    pageH - 10
  );

  const partnerSlug = input.partnerName ? `-${slugify(input.partnerName)}` : "";
  doc.save(`offre${partnerSlug}-${slugify(input.title) || "personnalisee"}.pdf`);
}

function drawIssuerBlock(
  doc: jsPDF,
  admin: ClubAdminProfile,
  contractType: ClubContractType,
  margin: number,
  startY: number
) {
  const pageW = doc.internal.pageSize.getWidth();
  const col2 = pageW / 2 + 4;
  let y = startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Association", margin, y);
  doc.text("Contrat", col2, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const left = [
    admin.associationName,
    admin.rna ? `RNA ${admin.rna}` : "RNA a renseigner",
    admin.siret ? `SIRET ${admin.siret}` : null,
    [admin.address, `${admin.postalCode} ${admin.city}`.trim()].filter(Boolean).join(" — "),
    [admin.phone, admin.email].filter(Boolean).join("  ·  "),
    admin.website || null,
    admin.legalRepName ? `${admin.legalRepTitle} : ${admin.legalRepName}` : null,
  ].filter(Boolean) as string[];
  const right = [
    `Type : ${contractTypeLabel(contractType)}`,
    admin.vatLiable && contractType === "sponsoring"
      ? `Assujetti TVA${admin.vatNumber ? ` — ${admin.vatNumber}` : ""}`
      : "Non assujetti / hors TVA (mecenat)",
    admin.bank ? `Banque : ${admin.bank}` : null,
  ].filter(Boolean) as string[];

  const lines = Math.max(left.length, right.length);
  for (let i = 0; i < lines; i += 1) {
    if (left[i]) doc.text(left[i], margin, y);
    if (right[i]) doc.text(right[i], col2, y);
    y += 4.5;
  }
  return y + 2;
}
