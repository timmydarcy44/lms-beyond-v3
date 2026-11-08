import { jsPDF } from "jspdf";
import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";

export type QuoteLine = {
  designation: string;
  description?: string;
  qty: string;
  unitPriceHt: string;
  vatRate: string;
  totalHt: string;
};

export type QuoteMoneyRow = {
  label: string;
  amount: string;
};

export type QuoteDetailData = {
  title: string;
  subtitle?: string;
  quoteNumber: string;
  lines: QuoteLine[];
  notes?: string;
  subtotalHt: string;
  discounts?: QuoteMoneyRow[];
  totals: {
    totalHt: string;
    vatRows: QuoteMoneyRow[];
    totalTtc: string;
  };
  deposit?: QuoteMoneyRow;
  ofFooter?: string;
};

function esc(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Montant centimes → « 5 378,40 € » */
export function formatEuroFromCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Remise en montant négatif typographique : « – 498,00 € » */
export function formatEuroDiscountFromCents(cents: number): string {
  const abs = formatEuroFromCents(Math.abs(cents));
  return `– ${abs}`;
}

export function buildQuoteDetailHtml(data: QuoteDetailData): string {
  const lines = data.lines
    .map((line, i) => {
      const num = String(i + 1).padStart(2, "0");
      return `<tr class="line">
        <td class="num">${num}</td>
        <td class="des">
          <strong>${esc(line.designation)}</strong>
          ${line.description ? `<p>${esc(line.description)}</p>` : ""}
        </td>
        <td class="qty">${esc(line.qty)}</td>
        <td class="unit">${esc(line.unitPriceHt)}</td>
        <td class="vat">${esc(line.vatRate)}</td>
        <td class="tot">${esc(line.totalHt)}</td>
      </tr>`;
    })
    .join("");

  const discounts = (data.discounts ?? [])
    .map(
      (d) =>
        `<div class="sum-row discount"><span>${esc(d.label)}</span><strong>${esc(d.amount)}</strong></div>`,
    )
    .join("");

  const vatRows = data.totals.vatRows
    .map(
      (v) =>
        `<div class="sum-row"><span>${esc(v.label)}</span><strong>${esc(v.amount)}</strong></div>`,
    )
    .join("");

  return `
<style>
  @page { size: A4; margin: 12mm 12mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #14151F;
    font-size: 9.5pt;
    line-height: 1.35;
  }
  .kicker {
    margin: 0 0 4px;
    font-size: 8.5pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #635BFF;
    font-weight: 700;
  }
  h1 {
    margin: 0 0 10px;
    font-size: 13.5pt;
    font-weight: 700;
  }
  table.lines {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  thead th {
    text-align: left;
    font-size: 7pt;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #7A8299;
    padding: 0 5px 6px;
    border-bottom: 1px solid #E6E8F0;
  }
  thead th.qty, thead th.unit, thead th.vat, thead th.tot,
  td.qty, td.unit, td.vat, td.tot { text-align: right; }
  td.num { width: 26px; color: #635BFF; font-weight: 700; font-variant-numeric: tabular-nums; font-size: 9pt; }
  td.des { width: auto; }
  td.qty { width: 36px; }
  td.unit { width: 72px; }
  td.vat { width: 44px; }
  td.tot { width: 78px; font-weight: 650; }
  tr.line td {
    padding: 4.5px 4px;
    border-bottom: 1px solid #EEF0F6;
    vertical-align: top;
    break-inside: avoid;
    page-break-inside: avoid;
    font-size: 9pt;
  }
  td.des strong { display: block; margin-bottom: 1px; font-size: 9.5pt; }
  td.des p { margin: 0; color: #5B647C; font-size: 8.5pt; }
  .notes {
    margin: 12px 0 12px;
    padding: 10px 12px;
    background: #F8F8FC;
    border-radius: 10px;
    color: #4A5168;
    font-size: 9pt;
  }
  .notes strong { color: #14151F; }
  .sums {
    width: 280px;
    margin-left: auto;
    margin-top: 8px;
  }
  .sum-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 5px 0;
    color: #4A5168;
    font-size: 9.5pt;
  }
  .sum-row.discount strong { color: #B42318; }
  .sum-row.total-ht {
    border-top: 1px solid #E6E8F0;
    margin-top: 4px;
    padding-top: 8px;
    color: #14151F;
    font-weight: 650;
  }
  .sum-row.ttc {
    margin-top: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #635BFF;
    color: #fff;
    font-size: 11pt;
    font-weight: 700;
  }
  .sum-row.deposit {
    margin-top: 8px;
    color: #14151F;
  }
  .foot {
    margin-top: 22px;
    font-size: 8pt;
    color: #8A91A5;
  }
</style>
<p class="kicker">Détail du devis</p>
<h1>${esc(data.title)}${data.subtitle ? ` · ${esc(data.subtitle)}` : ""}</h1>
<table class="lines">
  <thead>
    <tr>
      <th></th>
      <th>Désignation</th>
      <th class="qty">Qté</th>
      <th class="unit">Prix unit. HT</th>
      <th class="vat">TVA</th>
      <th class="tot">Total HT</th>
    </tr>
  </thead>
  <tbody>
    ${lines}
  </tbody>
</table>
${data.notes ? `<div class="notes"><strong>Notes.</strong> ${esc(data.notes)}</div>` : ""}
<div class="sums">
  <div class="sum-row"><span>Sous-total HT</span><strong>${esc(data.subtotalHt)}</strong></div>
  ${discounts}
  <div class="sum-row total-ht"><span>Total HT</span><strong>${esc(data.totals.totalHt)}</strong></div>
  ${vatRows}
  <div class="sum-row ttc"><span>À régler · Total TTC</span><strong>${esc(data.totals.totalTtc)}</strong></div>
  ${
    data.deposit
      ? `<div class="sum-row deposit"><span>${esc(data.deposit.label)}</span><strong>${esc(data.deposit.amount)}</strong></div>`
      : ""
  }
</div>
<p class="foot">Devis n° ${esc(data.quoteNumber)}${data.ofFooter ? ` · ${esc(data.ofFooter)}` : ""}</p>
`;
}

export function renderQuoteDetailPdfFallback(data: QuoteDetailData): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - margin * 2;
  let y = 18;

  const ensure = (need: number) => {
    if (y + need > doc.internal.pageSize.getHeight() - 16) {
      doc.addPage();
      y = 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(122, 130, 153);
      doc.text("Désignation / Qté / Prix unit. HT / TVA / Total HT", margin, y);
      y += 6;
    }
  };

  doc.setTextColor(99, 91, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DÉTAIL DU DEVIS", margin, y);
  y += 7;
  doc.setTextColor(20, 21, 31);
  doc.setFontSize(13);
  const title = `${data.title}${data.subtitle ? ` · ${data.subtitle}` : ""}`;
  const titleLines = doc.splitTextToSize(title, maxW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 4;

  data.lines.forEach((line, i) => {
    ensure(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(99, 91, 255);
    doc.text(String(i + 1).padStart(2, "0"), margin, y);
    doc.setTextColor(20, 21, 31);
    const des = doc.splitTextToSize(line.designation, maxW - 50);
    doc.text(des, margin + 10, y);
    y += des.length * 5;
    if (line.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(91, 100, 124);
      const d = doc.splitTextToSize(line.description, maxW - 50);
      ensure(d.length * 4.5 + 2);
      doc.text(d, margin + 10, y);
      y += d.length * 4.5;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(48, 54, 74);
    doc.text(
      `${line.qty} × ${line.unitPriceHt} · TVA ${line.vatRate} · ${line.totalHt}`,
      margin + 10,
      y,
    );
    y += 7;
  });

  if (data.notes) {
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Notes", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const n = doc.splitTextToSize(data.notes, maxW);
    ensure(n.length * 4.5);
    doc.text(n, margin, y);
    y += n.length * 4.5 + 4;
  }

  ensure(40);
  const rows: Array<[string, string]> = [
    ["Sous-total HT", data.subtotalHt],
    ...(data.discounts ?? []).map((d) => [d.label, d.amount] as [string, string]),
    ["Total HT", data.totals.totalHt],
    ...data.totals.vatRows.map((v) => [v.label, v.amount] as [string, string]),
    ["Total TTC", data.totals.totalTtc],
  ];
  if (data.deposit) rows.push([data.deposit.label, data.deposit.amount]);
  for (const [label, amount] of rows) {
    ensure(6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(label, margin, y);
    doc.text(amount, pageW - margin, y, { align: "right" });
    y += 6;
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export async function renderQuoteDetailPdf(data: QuoteDetailData): Promise<Buffer> {
  try {
    return await renderHtmlToPdf(buildQuoteDetailHtml(data), {
      marginMm: { top: 10, right: 10, bottom: 12, left: 10 },
    });
  } catch (err) {
    console.warn("[quote-detail] Puppeteer unavailable, jsPDF fallback", err);
    return renderQuoteDetailPdfFallback(data);
  }
}
