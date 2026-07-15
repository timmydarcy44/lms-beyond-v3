import { sendEmail } from "@/lib/email/resend-client";
import {
  buildCatalogueGreeting,
  DEFAULT_CATALOGUE_EMAIL_BODY,
  DEFAULT_CATALOGUE_EMAIL_SUBJECT,
} from "@/lib/crm/pipeline-catalogue-email-shared";
import { BTOB_CATALOGUE_STAGE_SLUG } from "@/lib/crm/pipeline-shared";
import { readFile } from "fs/promises";
import path from "path";

const DEFAULT_CATALOGUE_FILENAME = "Catalogue_EDGE_2027.pdf";
const DEFAULT_CATALOGUE_LOCAL_NAME = "catalogue-edge-btob.pdf";

export { DEFAULT_CATALOGUE_EMAIL_BODY } from "@/lib/crm/pipeline-catalogue-email-shared";

type CatalogueDealInput = {
  email: string | null;
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  contact_civility?: string | null;
  company_name: string;
};

export type SendCatalogueEmailOptions = CatalogueDealInput & {
  fromEmail: string;
  fromName?: string;
  bodyText?: string;
  subject?: string;
};

export function shouldSendBtobCatalogueEmail(params: {
  pipeline_type?: string | null;
  previous_stage_slug?: string | null;
  stage_slug: string;
  catalog_email_sent_at?: string | null;
}): boolean {
  if ((params.pipeline_type ?? "btob") !== "btob") return false;
  if (params.stage_slug !== BTOB_CATALOGUE_STAGE_SLUG) return false;
  if (params.previous_stage_slug === BTOB_CATALOGUE_STAGE_SLUG) return false;
  if (params.catalog_email_sent_at) return false;
  return true;
}

export function buildCatalogueEmailHtml(bodyText: string, deal: CatalogueDealInput): string {
  const greeting = buildCatalogueGreeting(deal);
  const lines = bodyText
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bodyLines = lines[0]?.toLowerCase().startsWith("bonjour")
    ? lines.slice(1)
    : lines;

  const paragraphs = bodyLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");

  return `
    <div style="font-family: system-ui, sans-serif; line-height: 1.6; color: #111;">
      <p>${escapeHtml(greeting)}</p>
      ${paragraphs}
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadCataloguePdfBuffer(): Promise<Buffer | null> {
  const remoteUrl = process.env.EDGE_BTOB_CATALOGUE_PDF_URL?.trim();
  if (remoteUrl) {
    try {
      const response = await fetch(remoteUrl);
      if (response.ok) {
        return Buffer.from(await response.arrayBuffer());
      }
      console.error("[crm/catalogue-email] PDF URL inaccessible:", response.status, remoteUrl);
    } catch (error) {
      console.error("[crm/catalogue-email] Échec fetch PDF URL:", error);
    }
  }

  const localPath =
    process.env.EDGE_BTOB_CATALOGUE_PDF_PATH?.trim() ||
    path.join(process.cwd(), "public", "documents", DEFAULT_CATALOGUE_LOCAL_NAME);

  try {
    return await readFile(localPath);
  } catch (error) {
    console.error("[crm/catalogue-email] PDF local introuvable:", localPath, error);
    return null;
  }
}

export async function sendBtobCatalogueEmail(
  options: SendCatalogueEmailOptions,
): Promise<{ success: boolean; error?: string }> {
  const recipient = options.email?.trim();
  if (!recipient) {
    return { success: false, error: "Email du contact manquant" };
  }

  const fromEmail = options.fromEmail?.trim();
  if (!fromEmail) {
    return { success: false, error: "Adresse d'expédition manquante" };
  }

  const pdf = await loadCataloguePdfBuffer();
  if (!pdf) {
    return {
      success: false,
      error:
        "Catalogue PDF introuvable (déposez public/documents/catalogue-edge-btob.pdf ou définissez EDGE_BTOB_CATALOGUE_PDF_URL)",
    };
  }

  const bodyText = options.bodyText?.trim() || DEFAULT_CATALOGUE_EMAIL_BODY;
  const fromName = options.fromName?.trim() || "EDGE";
  const html = buildCatalogueEmailHtml(bodyText, options);

  const filename =
    process.env.EDGE_BTOB_CATALOGUE_PDF_FILENAME?.trim() || DEFAULT_CATALOGUE_FILENAME;

  return sendEmail({
    to: recipient,
    subject: options.subject?.trim() || DEFAULT_CATALOGUE_EMAIL_SUBJECT,
    html,
    from: `${fromName} <${fromEmail}>`,
    attachments: [{ filename, content: pdf }],
  });
}

export async function sendBtobCatalogueFollowupEmail(deal: CatalogueDealInput): Promise<{
  success: boolean;
  error?: string;
}> {
  const recipient = deal.email?.trim();
  if (!recipient) {
    return { success: false, error: "Email du contact manquant" };
  }

  const greeting = buildCatalogueGreeting(deal);
  const companyLine = deal.company_name?.trim()
    ? `<p>Je me permets de revenir vers vous suite à l'envoi de notre catalogue pour <strong>${escapeHtml(deal.company_name)}</strong>.</p>`
    : "<p>Je me permets de revenir vers vous suite à l'envoi de notre catalogue.</p>";

  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.6; color: #111;">
      <p>${escapeHtml(greeting)}</p>
      ${companyLine}
      <p>Souhaitez-vous que l'on planifie un échange de 15 minutes pour voir si une formation correspond à vos besoins ?</p>
      <p>Bien cordialement,<br />L'équipe EDGE</p>
    </div>
  `;

  return sendEmail({
    to: recipient,
    subject: "Suite à l'envoi du catalogue EDGE",
    html,
    from: "EDGE <contact@edgebs.fr>",
  });
}
