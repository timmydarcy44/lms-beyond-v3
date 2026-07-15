import { jsPDF } from "jspdf";

export type JessicaInvoicePdfInput = {
  invoiceNumber: string;
  clientLabel: string;
  amountEuros: number;
  invoiceDate?: Date;
  consultationDate?: Date;
  paymentMethod?: string;
  designation?: string;
};

const ISSUER = {
  name: "Jessica CONTENTIN",
  title: "Professeure et psychopédagogue certifiée",
  siren: "SIREN 981 184 898",
  rpps: "N°RPPS : 10109804632",
  address1: "134 rue Elise Deroche",
  address2: "14760 Bretteville-sur-odon",
  phone: "0683477174",
  email: "contentin.cabinet@gmail.com",
};

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

/** Génère un PDF proche du modèle FACTURE ACQUITTEE Jessica Contentin. */
export function buildJessicaInvoicePdf(input: JessicaInvoicePdfInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const right = pageW - margin;

  const invoiceDate = input.invoiceDate ?? new Date();
  const consultationDate = input.consultationDate ?? invoiceDate;
  const paymentMethod = input.paymentMethod?.trim() || "Carte bancaire";
  const designation = input.designation?.trim() || "Consultation";
  const amount = Math.round(input.amountEuros * 100) / 100;
  const amountLabel = `${formatEuro(amount)} €`;

  // En-tête gauche
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(ISSUER.name, margin, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(ISSUER.title, margin, 30);
  doc.text(ISSUER.siren, margin, 36);
  doc.text(ISSUER.rpps, margin, 41);
  doc.text(ISSUER.address1, margin, 48);
  doc.text(ISSUER.address2, margin, 53);
  doc.text(ISSUER.phone, margin, 58);
  doc.text(ISSUER.email, margin, 63);

  // Titre droite
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("FACTURE ACQUITTEE", right, 24, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const metaTop = 36;
  const metaLabelX = 118;
  const metaValueX = right;
  const rows: Array<[string, string]> = [
    ["Numéro de facture :", input.invoiceNumber],
    ["à l'attention de :", input.clientLabel],
    ["Date de la facture :", formatLongDate(invoiceDate)],
    ["Paiement :", paymentMethod],
  ];
  rows.forEach(([label, value], i) => {
    const y = metaTop + i * 7;
    doc.setFont("helvetica", "normal");
    doc.text(label, metaLabelX, y);
    doc.setFont("helvetica", "bold");
    doc.text(value, metaValueX, y, { align: "right" });
  });

  // Sous-titre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Accompagnement psychopédagogique", margin, 78);

  // Tableau
  const tableTop = 88;
  const colX = {
    designation: margin,
    date: 78,
    qty: 118,
    price: 140,
    total: right,
  };

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, tableTop - 6, pageW - margin * 2, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Désignation", colX.designation, tableTop);
  doc.text("Date consultation", colX.date, tableTop);
  doc.text("Quantité", colX.qty, tableTop);
  doc.text("Prix HT", colX.price, tableTop);
  doc.text("Total", colX.total, tableTop, { align: "right" });

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, tableTop + 3, right, tableTop + 3);

  const lineY = tableTop + 12;
  doc.setFont("helvetica", "normal");
  doc.text(designation, colX.designation, lineY);
  doc.text(formatShortDate(consultationDate), colX.date, lineY);
  doc.text("1", colX.qty, lineY);
  doc.text(amountLabel, colX.price, lineY);
  doc.text(amountLabel, colX.total, lineY, { align: "right" });

  // Totaux
  const totalsY = lineY + 24;
  const totalsLabelX = 130;
  doc.setFont("helvetica", "normal");
  doc.text("Sous total HT", totalsLabelX, totalsY);
  doc.text(amountLabel, right, totalsY, { align: "right" });
  doc.text("Total HT", totalsLabelX, totalsY + 7);
  doc.text(amountLabel, right, totalsY + 7, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Total TTC", totalsLabelX, totalsY + 14);
  doc.text(amountLabel, right, totalsY + 14, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("TVA non applicable, art. 293 B du CGI", margin, totalsY + 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Valeur en votre aimable règlement par virement bancaire ou chèque au comptant.",
    margin,
    totalsY + 38,
  );

  const legal = [
    "Taux de pénalités exigibles de plein droit et sans rappel préalable en cas de paiement à une date ultérieure à celle figurant sur la",
    "facture : 10 % Indemnité forfaitaire pour frais de recouvrement en cas de paiement à une date ultérieure à celle figurant sur la facture :",
    "40 €. Si les frais de recouvrement sont supérieurs à ce montant, une indemnisation complémentaire sera due, sur présentation des",
    "justificatifs.",
  ];
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  legal.forEach((line, i) => {
    doc.text(line, margin, totalsY + 50 + i * 4.5);
  });
  doc.setTextColor(0, 0, 0);

  return doc;
}

export function downloadJessicaInvoicePdf(input: JessicaInvoicePdfInput, filename?: string) {
  const doc = buildJessicaInvoicePdf(input);
  doc.save(filename ?? `${input.invoiceNumber}.pdf`);
}
