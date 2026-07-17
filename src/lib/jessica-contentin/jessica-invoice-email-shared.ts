import type { JessicaStoredInvoice } from "@/lib/jessica-contentin/jessica-invoice-shared";

function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });
}

/** Corps d'email par défaut — vouvoiement patient. */
export function buildJessicaInvoiceEmailBodyText(invoice: JessicaStoredInvoice): string {
  const amountLabel = formatEuro(invoice.amount_cents);
  const firstName = invoice.client_label?.trim().split(/\s+/)[0] ?? "";
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  return `${greeting}

Je vous prie de trouver ci-joint votre facture acquittée ${invoice.invoice_number}, d'un montant de ${amountLabel}.

Pour toute question, vous pouvez répondre directement à cet email.

Bien cordialement,
Jessica CONTENTIN
Psychopédagogue certifiée`;
}

export function buildJessicaInvoiceEmailSubject(invoice: JessicaStoredInvoice): string {
  return `Facture ${invoice.invoice_number} — Jessica CONTENTIN`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function jessicaInvoiceBodyTextToHtml(bodyText: string): string {
  const paragraphs = bodyText
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const withBreaks = escapeHtml(block).replace(/\n/g, "<br/>");
      return `<p style="margin:0 0 16px;">${withBreaks}</p>`;
    })
    .join("");

  return `
    <div style="font-family:Georgia,serif;color:#2F2A25;max-width:560px;line-height:1.6;">
      ${paragraphs}
    </div>
  `;
}
