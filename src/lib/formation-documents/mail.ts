import {
  buildEdgeEmailShell,
  escapeEdgeEmailHtml,
  edgeEmailParagraph,
} from "@/lib/emails/edge-email-shell";
import { MAIL_COPY, type Lot4DocumentKind } from "@/lib/formation-documents/constants";
import { formatEuro } from "@/lib/money/format-euro";

export function buildFormationDocMail(params: {
  kind: Lot4DocumentKind;
  recipientName?: string | null;
  courseTitle?: string | null;
  viewUrl: string;
  extraParagraphs?: string[];
  organizationName?: string | null;
  amountHtCents?: number | null;
  amountTvaCents?: number | null;
  amountTtcCents?: number | null;
  quoteNumber?: string | null;
  issuedAt?: string | null;
}): { subject: string; html: string } {
  if (params.kind === "devis" || params.kind === "convention") {
    return buildNeoBanqueSignableMail(params);
  }

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

/** E-mail devis / convention — style néo-banque aligné sur la page /doc. */
function buildNeoBanqueSignableMail(params: {
  kind: "devis" | "convention" | Lot4DocumentKind;
  recipientName?: string | null;
  courseTitle?: string | null;
  viewUrl: string;
  organizationName?: string | null;
  amountHtCents?: number | null;
  amountTvaCents?: number | null;
  amountTtcCents?: number | null;
  quoteNumber?: string | null;
  issuedAt?: string | null;
  extraParagraphs?: string[];
}): { subject: string; html: string } {
  const isDevis = params.kind === "devis";
  const copy = MAIL_COPY[params.kind as Lot4DocumentKind];
  const contactName = (params.recipientName || "").trim();
  const orgName = (params.organizationName || "").trim();
  const name = escapeEdgeEmailHtml(contactName);
  const org = escapeEdgeEmailHtml(orgName || "Client");
  const course = escapeEdgeEmailHtml(params.courseTitle?.trim() || "Formation");
  const quote = escapeEdgeEmailHtml(
    params.quoteNumber?.trim() || (isDevis ? "Devis" : "Convention"),
  );
  const issued = params.issuedAt
    ? new Date(params.issuedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  // Contact = personne (prénom/nom), jamais la raison sociale en titre.
  const displayContact = contactName || orgName || "Client";
  const displayContactEsc = escapeEdgeEmailHtml(displayContact);
  const initials = displayContact
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "BY";

  const contactCard = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
    <tr><td style="padding:12px 14px;border-radius:16px;background:rgba(255,255,255,0.12);">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="width:36px;height:36px;border-radius:999px;background:#FFFFFF;color:#0A0B12;font-size:12px;font-weight:800;text-align:center;line-height:36px;">
            ${escapeEdgeEmailHtml(initials)}
          </td>
          <td style="padding-left:10px;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#FFFFFF;">${displayContactEsc}</p>
            <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.75);">
              ${
                contactName && orgName && contactName.toLowerCase() !== orgName.toLowerCase()
                  ? `${org} · `
                  : ""
              }Proposé par SAS Byound Business
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`;

  let heroBlock = "";
  if (isDevis) {
    const ht = params.amountHtCents != null ? formatEuro(params.amountHtCents) : null;
    const tva = params.amountTvaCents != null ? formatEuro(params.amountTvaCents) : null;
    const ttc =
      params.amountTtcCents != null ? formatEuro(params.amountTtcCents) : ht;
    const breakdown =
      ht && tva && ttc
        ? `TTC · soit ${escapeEdgeEmailHtml(ht)} HT + ${escapeEdgeEmailHtml(tva)} de TVA`
        : ttc
          ? "Montant TTC"
          : "";

    heroBlock = ttc
      ? `<tr><td style="padding:0 0 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="border-radius:28px;background:linear-gradient(135deg,#1A1440 0%,#3A2BA0 45%,#6E5BFF 100%);">
          <tr><td style="padding:22px 22px 20px;">
            <span style="display:inline-block;padding:5px 10px;border-radius:999px;background:rgba(245,200,92,0.2);color:#F5C85C;font-size:12px;font-weight:700;">
              ● En attente de votre accord
            </span>
            <p style="margin:14px 0 0;font-size:13px;line-height:1.4;color:rgba(255,255,255,0.85);">
              Devis n° ${quote} · émis le ${escapeEdgeEmailHtml(issued)}
            </p>
            <p style="margin:10px 0 0;font-size:36px;line-height:1.1;font-weight:800;letter-spacing:-0.03em;color:#FFFFFF;">
              ${escapeEdgeEmailHtml(ttc)}
            </p>
            ${
              breakdown
                ? `<p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${breakdown}</p>`
                : ""
            }
            ${contactCard}
          </td></tr>
        </table>
      </td></tr>`
      : "";
  } else {
    // Convention : pas de tarif en tête
    heroBlock = `<tr><td style="padding:0 0 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
        style="border-radius:28px;background:linear-gradient(135deg,#1A1440 0%,#3A2BA0 45%,#6E5BFF 100%);">
        <tr><td style="padding:22px 22px 20px;">
          <span style="display:inline-block;padding:5px 10px;border-radius:999px;background:rgba(245,200,92,0.2);color:#F5C85C;font-size:12px;font-weight:700;">
            ● À signer
          </span>
          <p style="margin:14px 0 0;font-size:13px;line-height:1.4;color:rgba(255,255,255,0.85);">
            Convention · émise le ${escapeEdgeEmailHtml(issued)}
          </p>
          <p style="margin:10px 0 0;font-size:24px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:#FFFFFF;">
            ${course}
          </p>
          <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">
            CGV et règlement intérieur joints en pièces jointes.
          </p>
          ${contactCard}
        </td></tr>
      </table>
    </td></tr>`;
  }

  const extras = (params.extraParagraphs ?? [])
    .map(
      (p) =>
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#9AA0B5;">${escapeEdgeEmailHtml(p)}</p>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeEdgeEmailHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0A0B12;font-family:Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeEdgeEmailHtml(copy.body)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0A0B12;">
    <tr><td align="center" style="padding:28px 16px 48px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">
        <tr><td style="padding:0 0 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="width:28px;height:28px;border-radius:8px;background:#6E5BFF;color:#FFFFFF;font-size:14px;font-weight:800;text-align:center;line-height:28px;">B</td>
              <td style="padding-left:10px;font-size:16px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;">Byound</td>
            </tr>
          </table>
        </td></tr>

        ${heroBlock}

        <tr><td style="padding:0 0 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#15171E;border-radius:24px;">
            <tr><td style="padding:20px;">
              <p style="margin:0;font-size:15px;font-weight:700;color:#F3F4FA;">
                ${name ? `Bonjour ${name},` : "Bonjour,"}
              </p>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.55;color:#9AA0B5;">
                ${escapeEdgeEmailHtml(copy.body)}
              </p>
              <p style="margin:10px 0 0;font-size:13px;color:#9AA0B5;">
                Formation : <span style="color:#F3F4FA;font-weight:600;">${course}</span>
              </p>
              ${
                isDevis
                  ? `<p style="margin:10px 0 0;font-size:13px;color:#9AA0B5;">
                Les <a href="https://www.byound.fr/cgv" style="color:#B7AEFF;text-decoration:underline;">conditions générales de vente</a> s’appliquent à ce devis.
              </p>`
                  : `<p style="margin:10px 0 0;font-size:13px;color:#9AA0B5;">
                Les CGV et le règlement intérieur sont en pièces jointes de cet e-mail.
              </p>`
              }
              ${extras}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                <tr><td align="center" style="background:#6E5BFF;border-radius:999px;">
                  <a href="${escapeEdgeEmailHtml(params.viewUrl)}" target="_blank" rel="noopener noreferrer"
                     style="display:block;padding:16px 22px;font-size:15px;font-weight:800;color:#FFFFFF;text-decoration:none;letter-spacing:-0.02em;">
                    ${escapeEdgeEmailHtml(copy.cta)} →
                  </a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:8px 4px 0;text-align:center;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#6B7288;">
            SAS Byound Business · TVA FR30130709058<br />
            Lien personnel — ne pas transférer. Son acceptation vaut commande, sous réserve de la convention de formation.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: copy.subject, html };
}
