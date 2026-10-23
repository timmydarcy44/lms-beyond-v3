import { EDGE_EMAIL_LOGO_URL, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

function layout(params: {
  preheader: string;
  title: string;
  intro: string;
  extra?: string;
  cta?: { label: string; href: string };
  footnote?: string;
}): string {
  const cta = params.cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0 0;">
        <tr><td style="background:#111111;border-radius:999px;">
          <a href="${params.cta.href}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:16px 28px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:-0.02em;">
            ${escapeEdgeEmailHtml(params.cta.label)}
          </a>
        </td></tr>
      </table>`
    : "";
  const extra = params.extra
    ? `<p style="margin:18px 0 0;max-width:440px;font-size:16px;line-height:1.55;color:#5C6370;">${params.extra}</p>`
    : "";
  const footnote = params.footnote
    ? `<p style="margin:32px 0 0;font-size:14px;line-height:1.5;color:#8A8F98;">${escapeEdgeEmailHtml(params.footnote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeEdgeEmailHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeEdgeEmailHtml(params.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FFFFFF;">
    <tr><td align="left" style="padding:56px 28px 72px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
        <tr><td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr><td style="background:#111111;border-radius:14px;padding:12px 16px;">
              <img src="${EDGE_EMAIL_LOGO_URL}" alt="Byound" width="88" style="display:block;width:88px;height:auto;border:0;" />
            </td></tr>
          </table>
          <h1 style="margin:36px 0 0;font-size:40px;line-height:1.05;font-weight:800;letter-spacing:-1.4px;color:#111111;">${escapeEdgeEmailHtml(params.title)}</h1>
          <p style="margin:14px 0 0;max-width:440px;font-size:16px;line-height:1.55;color:#5C6370;">${params.intro}</p>
          ${extra}
          ${cta}
          ${footnote}
          <p style="margin:48px 0 0;font-size:13px;line-height:1.5;color:#8A8F98;">Byound · byound.fr</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function getCollaboratorInviteEmail(params: {
  firstName?: string;
  companyName: string;
  inviteLink: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  const company = escapeEdgeEmailHtml(params.companyName);
  return {
    subject: `${params.companyName} vous invite sur Byound`,
    html: layout({
      preheader: `${params.companyName} vous ouvre votre espace collaborateur.`,
      title: name ? `Bonjour ${name}` : "Votre espace est prêt",
      intro: `${company} vous invite à rejoindre Byound. Créez votre mot de passe pour accéder à vos tests, vos formations et vos entretiens.`,
      cta: { label: "Créer mon accès", href: params.inviteLink },
      footnote: "Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.",
    }),
  };
}

export function getCollaboratorTestEmail(params: {
  firstName?: string;
  testLabel: string;
  companyName?: string | null;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  const company = params.companyName?.trim();
  return {
    subject: `Bravo, votre ${params.testLabel} est terminé`,
    html: layout({
      preheader: `Votre ${params.testLabel} est enregistré.`,
      title: "Félicitations",
      intro: `${name ? `${escapeEdgeEmailHtml(name)}, votre` : "Votre"} ${escapeEdgeEmailHtml(params.testLabel)} est bien enregistré${company ? ` pour ${escapeEdgeEmailHtml(company)}` : ""}.`,
      extra: "Votre équipe RH peut maintenant en tenir compte. Vous pouvez retrouver le résultat dans votre espace.",
      cta: { label: "Ouvrir mon espace", href: "https://www.byound.fr/dashboard/salarie" },
    }),
  };
}

export function getCollaboratorSignatureEmail(params: {
  firstName?: string;
  title: string;
  companyName: string;
  signLink: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  return {
    subject: `Signature demandée — ${params.title}`,
    html: layout({
      preheader: `${params.companyName} vous demande de signer la synthèse de votre entretien.`,
      title: "Votre signature",
      intro: `${name ? `${escapeEdgeEmailHtml(name)}, ` : ""}${escapeEdgeEmailHtml(params.companyName)} vous demande de signer la synthèse « ${escapeEdgeEmailHtml(params.title)} ».`,
      extra: "La signature confirme que vous avez pris connaissance de la synthèse. Elle n'a pas valeur de signature électronique qualifiée.",
      cta: { label: "Lire et signer", href: params.signLink },
    }),
  };
}
