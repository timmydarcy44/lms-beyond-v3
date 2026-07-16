import { jessicaInvoicePdfBase64 } from "@/lib/jessica-contentin/jessica-invoice-pdf";
import {
  storedInvoiceToPdfInput,
  type JessicaStoredInvoice,
} from "@/lib/jessica-contentin/jessica-invoice-shared";
import { sendJessicaResendEmail } from "@/lib/jessica-contentin/jessica-resend";

function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });
}

export async function sendJessicaInvoiceEmail(
  invoice: JessicaStoredInvoice,
  recipientEmail: string,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const to = recipientEmail.trim();
  if (!to) {
    return { success: false, error: "Adresse email du client manquante" };
  }

  const pdfInput = storedInvoiceToPdfInput(invoice);
  const pdfBase64 = jessicaInvoicePdfBase64(pdfInput);
  const amountLabel = formatEuro(invoice.amount_cents);

  const html = `
    <div style="font-family:Georgia,serif;color:#2F2A25;max-width:560px;line-height:1.6;">
      <p>Bonjour${invoice.client_label ? ` ${invoice.client_label.split(" ")[0]}` : ""},</p>
      <p>
        Veuillez trouver ci-joint votre facture acquittée
        <strong>${invoice.invoice_number}</strong>
        d'un montant de <strong>${amountLabel}</strong>.
      </p>
      <p style="color:#5C5348;font-size:14px;">
        Pour toute question, vous pouvez répondre directement à cet email.
      </p>
      <p style="margin-top:24px;">
        Bien cordialement,<br/>
        <strong>Jessica CONTENTIN</strong><br/>
        <span style="color:#5C5348;font-size:14px;">Psychopédagogue certifiée</span>
      </p>
    </div>
  `;

  return sendJessicaResendEmail({
    to,
    subject: `Facture ${invoice.invoice_number} — Jessica CONTENTIN`,
    html,
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: Buffer.from(pdfBase64, "base64"),
      },
    ],
  });
}
