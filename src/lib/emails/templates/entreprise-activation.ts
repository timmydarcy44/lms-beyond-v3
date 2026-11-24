import { edgeEmailBrand, edgeEmailButton, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

function layout(params: {
  preheader: string;
  title: string;
  intro: string;
  extra?: string;
  cta?: { label: string; href: string };
  footnote?: string;
}): string {
  const cta = params.cta ? edgeEmailButton(params.cta.label, params.cta.href) : "";
  const extra = params.extra
    ? `<div style="margin:18px 0 0;max-width:440px;font-size:16px;line-height:1.55;color:#5C6370;">${params.extra}</div>`
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
          ${edgeEmailBrand("light")}
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

function p(text: string): string {
  return `<p style="margin:0 0 12px;">${text}</p>`;
}

export function getRhMetiersEmail(params: {
  firstName?: string | null;
  companyName: string;
  metiersHref: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  return {
    subject: `Créez vos métiers sur Byound — ${params.companyName}`,
    html: layout({
      preheader: "Sans métiers, les tests ne produisent pas d'écarts utiles.",
      title: name ? `${name}, une étape clé` : "Une étape clé",
      intro: `Pour ${escapeEdgeEmailHtml(params.companyName)}, créez au moins un métier cible. C’est ce qui transforme les tests en écarts de compétences actionnables.`,
      cta: { label: "Créer mes métiers", href: params.metiersHref },
    }),
  };
}

export function getRhOuverturesEmail(params: {
  firstName?: string | null;
  companyName: string;
  stuckCount: number;
  sampleNames: string[];
  teamHref: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  const n = params.stuckCount;
  const samples = params.sampleNames
    .slice(0, 3)
    .map((s) => escapeEdgeEmailHtml(s))
    .join(", ");
  return {
    subject: `${n} collaborateur${n > 1 ? "s" : ""} n’${n > 1 ? "ont" : "a"} pas encore ouvert Byound`,
    html: layout({
      preheader: "Relancez les accès avant que l’équipe perde le fil.",
      title: name ? `${name}, ça bloque` : "Ça bloque côté accès",
      intro: `Chez ${escapeEdgeEmailHtml(params.companyName)}, ${n} personne${n > 1 ? "s" : ""} n’${n > 1 ? "ont" : "a"} pas encore créé ${n > 1 ? "leurs" : "son"} mot de passe ou ${n > 1 ? "ne se sont" : "ne s’est"} pas connecté${n > 1 ? "es" : ""}.`,
      extra: samples ? p(`Ex. : ${samples}${params.stuckCount > 3 ? "…" : ""}`) : undefined,
      cta: { label: "Voir l’équipe", href: params.teamHref },
    }),
  };
}

export function getRhTestsEmail(params: {
  firstName?: string | null;
  companyName: string;
  incompleteCount: number;
  sampleLines: string[];
  teamHref: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  const n = params.incompleteCount;
  const lines = params.sampleLines
    .slice(0, 4)
    .map((line) => `<li style="margin:0 0 6px;">${escapeEdgeEmailHtml(line)}</li>`)
    .join("");
  return {
    subject: `${n} collaborateur${n > 1 ? "s" : ""} n’${n > 1 ? "ont" : "a"} pas fini les 3 tests`,
    html: layout({
      preheader: "Les écarts de compétences apparaissent dès que les tests sont complets.",
      title: name ? `${name}, tests incomplets` : "Tests incomplets",
      intro: `Chez ${escapeEdgeEmailHtml(params.companyName)}, ${n} personne${n > 1 ? "s" : ""} ${n > 1 ? "sont" : "est"} encore sous 3/3.`,
      extra: lines ? `<ul style="margin:0;padding-left:18px;">${lines}</ul>` : undefined,
      cta: { label: "Suivre les tests", href: params.teamHref },
    }),
  };
}

export function getCollabAccesEmail(params: {
  firstName?: string | null;
  companyName: string;
  accessLink: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  return {
    subject: `${params.companyName} — finalisez votre accès Byound`,
    html: layout({
      preheader: "Créez votre mot de passe pour démarrer.",
      title: name ? `${name}, votre accès attend` : "Votre accès attend",
      intro: `${escapeEdgeEmailHtml(params.companyName)} vous a ouvert un espace Byound. Il reste à créer votre mot de passe pour accéder à vos tests.`,
      cta: { label: "Créer mon accès", href: params.accessLink },
      footnote: "Si vous n’attendiez pas cet email, vous pouvez l’ignorer.",
    }),
  };
}

export function getCollabTestsEmail(params: {
  firstName?: string | null;
  companyName: string;
  testsDone: number;
  testsTotal: number;
  testsHref: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  const left = Math.max(0, params.testsTotal - params.testsDone);
  return {
    subject: `Il vous reste ${left} test${left > 1 ? "s" : ""} Byound`,
    html: layout({
      preheader: `Progression ${params.testsDone}/${params.testsTotal}.`,
      title: name ? `${name}, encore ${left} test${left > 1 ? "s" : ""}` : `Encore ${left} test${left > 1 ? "s" : ""}`,
      intro: `Vous êtes à ${params.testsDone}/${params.testsTotal} pour ${escapeEdgeEmailHtml(params.companyName)}. Terminez pour débloquer votre lecture compétences.`,
      cta: { label: "Continuer mes tests", href: params.testsHref },
    }),
  };
}

export function getCollabLastReminderEmail(params: {
  firstName?: string | null;
  companyName: string;
  accessLink: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  return {
    subject: `Dernier rappel — votre espace ${params.companyName}`,
    html: layout({
      preheader: "Dernier rappel d’activation Byound.",
      title: name ? `${name}, dernier rappel` : "Dernier rappel",
      intro: `Votre invitation Byound pour ${escapeEdgeEmailHtml(params.companyName)} est toujours en attente. Après ce message, nous n’enverrons plus de relance automatique.`,
      cta: { label: "Ouvrir mon espace", href: params.accessLink },
    }),
  };
}

export function getRhEcartsEmail(params: {
  firstName?: string | null;
  companyName: string;
  gaps: Array<{ skill: string; metierTitle: string; underTargetCount: number }>;
  gapsHref: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  const items = params.gaps
    .slice(0, 3)
    .map(
      (g) =>
        `<li style="margin:0 0 8px;"><strong>${escapeEdgeEmailHtml(g.skill)}</strong> · ${escapeEdgeEmailHtml(g.metierTitle)} · ${g.underTargetCount} personne${g.underTargetCount > 1 ? "s" : ""}</li>`,
    )
    .join("");
  return {
    subject: `3 écarts prioritaires — ${params.companyName}`,
    html: layout({
      preheader: "Vos premiers écarts de compétences sont prêts.",
      title: name ? `${name}, vos écarts` : "Vos écarts prioritaires",
      intro: `Assez de tests sont complets chez ${escapeEdgeEmailHtml(params.companyName)} pour identifier des priorités. Voici les 3 écarts les plus utiles à traiter.`,
      extra: items ? `<ul style="margin:0;padding-left:18px;">${items}</ul>` : undefined,
      cta: { label: "Analyser et former", href: params.gapsHref },
    }),
  };
}

export function getFormationAssigneeEmail(params: {
  firstName?: string | null;
  companyName: string;
  formationTitle: string;
  formationHref: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  return {
    subject: `Nouvelle formation — ${params.formationTitle}`,
    html: layout({
      preheader: `${params.companyName} vous a assigné une formation.`,
      title: name ? `${name}, une formation pour vous` : "Une formation pour vous",
      intro: `${escapeEdgeEmailHtml(params.companyName)} vous a assigné « ${escapeEdgeEmailHtml(params.formationTitle)} ».`,
      cta: { label: "Ouvrir la formation", href: params.formationHref },
    }),
  };
}

export function getRhAbandonEmail(params: {
  firstName?: string | null;
  companyName: string;
  learnerName: string;
  formationTitle: string;
  dossierHref: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  return {
    subject: `Abandon formation — ${params.learnerName}`,
    html: layout({
      preheader: "Un signal abandon vient d’être enregistré.",
      title: name ? `${name}, signal abandon` : "Signal abandon",
      intro: `${escapeEdgeEmailHtml(params.learnerName)} a un abandon enregistré sur « ${escapeEdgeEmailHtml(params.formationTitle)} » (${escapeEdgeEmailHtml(params.companyName)}).`,
      cta: { label: "Voir le dossier", href: params.dossierHref },
    }),
  };
}

export function getRhBadgeSignalEmail(params: {
  firstName?: string | null;
  companyName: string;
  learnerName: string;
  badgeName: string;
  teamHref: string;
}): { subject: string; html: string } {
  const name = params.firstName?.trim();
  return {
    subject: `Badge obtenu — ${params.learnerName}`,
    html: layout({
      preheader: `${params.learnerName} a obtenu un badge.`,
      title: name ? `${name}, un badge décroché` : "Un badge décroché",
      intro: `${escapeEdgeEmailHtml(params.learnerName)} a obtenu « ${escapeEdgeEmailHtml(params.badgeName)} » chez ${escapeEdgeEmailHtml(params.companyName)}.`,
      cta: { label: "Voir l’équipe", href: params.teamHref },
    }),
  };
}
