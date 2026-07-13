import { sendEmail } from "@/lib/email/resend-client";
import { BTOB_CATALOGUE_STAGE_SLUG } from "@/lib/crm/pipeline-shared";
import { readFile } from "fs/promises";
import path from "path";

const DEFAULT_CATALOGUE_FILENAME = "Catalogue_EDGE_2027.pdf";
const DEFAULT_CATALOGUE_LOCAL_NAME = "catalogue-edge-btob.pdf";

type CatalogueDealInput = {
  email: string | null;
  contact_first_name?: string | null;
  company_name: string;
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
  deal: CatalogueDealInput,
): Promise<{ success: boolean; error?: string }> {
  const recipient = deal.email?.trim();
  if (!recipient) {
    return { success: false, error: "Email du contact manquant" };
  }

  const pdf = await loadCataloguePdfBuffer();
  if (!pdf) {
    return {
      success: false,
      error:
        "Catalogue PDF introuvable (déposez public/documents/catalogue-edge-btob.pdf ou définissez EDGE_BTOB_CATALOGUE_PDF_URL)",
    };
  }

  const firstName = deal.contact_first_name?.trim();
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";
  const companyLine = deal.company_name?.trim()
    ? `<p>Nous avons le plaisir de vous adresser le catalogue des formations EDGE pour <strong>${deal.company_name}</strong>.</p>`
    : "<p>Nous avons le plaisir de vous adresser le catalogue des formations EDGE.</p>";

  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.6; color: #111;">
      <p>${greeting}</p>
      <p>Veuillez trouver ci-joint le catalogue de nos formations.</p>
      ${companyLine}
      <p>N'hésitez pas à revenir vers nous pour toute question ou pour planifier un échange avec notre équipe.</p>
      <p>Bien cordialement,<br />L'équipe EDGE</p>
    </div>
  `;

  const filename =
    process.env.EDGE_BTOB_CATALOGUE_PDF_FILENAME?.trim() || DEFAULT_CATALOGUE_FILENAME;

  return sendEmail({
    to: recipient,
    subject: "Catalogue des formations EDGE",
    html,
    from: "Timmy Darcy <darcy@edgebs.fr>",
    attachments: [{ filename, content: pdf }],
  });
}
