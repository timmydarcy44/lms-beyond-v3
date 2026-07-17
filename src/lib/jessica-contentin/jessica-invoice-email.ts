import { jessicaInvoicePdfBase64 } from "@/lib/jessica-contentin/jessica-invoice-pdf";
import {
  buildJessicaInvoiceEmailBodyText,
  buildJessicaInvoiceEmailSubject,
  jessicaInvoiceBodyTextToHtml,
} from "@/lib/jessica-contentin/jessica-invoice-email-shared";
import {
  storedInvoiceToPdfInput,
  type JessicaStoredInvoice,
} from "@/lib/jessica-contentin/jessica-invoice-shared";
import { sendJessicaResendEmail } from "@/lib/jessica-contentin/jessica-resend";

export {
  buildJessicaInvoiceEmailBodyText,
  buildJessicaInvoiceEmailSubject,
  jessicaInvoiceBodyTextToHtml,
} from "@/lib/jessica-contentin/jessica-invoice-email-shared";

export type SendJessicaInvoiceEmailOptions = {
  recipientEmail: string;
  subject?: string;
  bodyText?: string;
};

export async function sendJessicaInvoiceEmail(
  invoice: JessicaStoredInvoice,
  options: SendJessicaInvoiceEmailOptions | string,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const opts: SendJessicaInvoiceEmailOptions =
    typeof options === "string" ? { recipientEmail: options } : options;

  const to = opts.recipientEmail.trim();
  if (!to) {
    return { success: false, error: "Adresse email du client manquante" };
  }

  const pdfInput = storedInvoiceToPdfInput(invoice);
  const pdfBase64 = jessicaInvoicePdfBase64(pdfInput);
  const bodyText = opts.bodyText?.trim() || buildJessicaInvoiceEmailBodyText(invoice);
  const subject = opts.subject?.trim() || buildJessicaInvoiceEmailSubject(invoice);
  const html = jessicaInvoiceBodyTextToHtml(bodyText);

  return sendJessicaResendEmail({
    to,
    subject,
    html,
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: Buffer.from(pdfBase64, "base64"),
      },
    ],
  });
}
