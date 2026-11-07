import {
  buildEdgeEmailShell,
  escapeEdgeEmailHtml,
  edgeEmailParagraph,
} from "@/lib/emails/edge-email-shell";
import { MAIL_COPY, type Lot4DocumentKind } from "@/lib/formation-documents/constants";

export function buildFormationDocMail(params: {
  kind: Lot4DocumentKind;
  recipientName?: string | null;
  courseTitle?: string | null;
  viewUrl: string;
  extraParagraphs?: string[];
}): { subject: string; html: string } {
  const copy = MAIL_COPY[params.kind];
  const greeting = params.recipientName
    ? `Bonjour ${escapeEdgeEmailHtml(params.recipientName)},`
    : "Bonjour,";
  const course = params.courseTitle
    ? edgeEmailParagraph(`Formation : ${params.courseTitle}`)
    : "";
  const extras = (params.extraParagraphs ?? [])
    .map((p) => edgeEmailParagraph(p))
    .join("");

  const html = buildEdgeEmailShell({
    title: copy.title,
    preheader: copy.body,
    bodyHtml: `${edgeEmailParagraph(greeting)}${edgeEmailParagraph(copy.body)}${course}${extras}`,
    cta: { label: copy.cta, href: params.viewUrl },
    footerNote:
      "Byound — organisme de formation. Cet e-mail concerne votre dossier formation. Ne transférez pas le lien d'accès.",
  });

  return { subject: copy.subject, html };
}
