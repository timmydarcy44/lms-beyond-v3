import {
  buildEdgeEmailShell,
  edgeEmailHighlight,
  edgeEmailParagraph,
} from "@/lib/emails/edge-email-shell";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://edgebs.fr";

export function getParticulierWelcomeEmail(params: { firstName: string; confirmationLink: string }) {
  const name = params.firstName.trim();
  const html = buildEdgeEmailShell({
    title: name ? `Bienvenue ${name}` : "Bienvenue",
    preheader: "Votre espace EDGE est prêt",
    bodyHtml: [
      edgeEmailParagraph("Vous venez de créer votre espace EDGE."),
      edgeEmailParagraph("Complétez votre test comportemental, votre test de personnalité et votre test des soft skills."),
    ].join(""),
    cta: { label: "Ouvrir mon espace EDGE", href: params.confirmationLink },
    footerNote: "Inscription gratuite · sans engagement · lien valable 24 h",
  });
  return {
    subject: name ? `${name}, bienvenue sur EDGE` : "Bienvenue sur EDGE",
    html,
  };
}

export function getParticulierTestCompletedEmail(params: {
  firstName: string;
  testName: string;
  dashboardHref?: string;
}) {
  const html = buildEdgeEmailShell({
    title: "Test terminé",
    preheader: `${params.testName} — résultats disponibles`,
    bodyHtml: edgeEmailParagraph(
      `${params.firstName.trim() || "Votre"} test « ${params.testName} » est terminé. Consultez vos résultats dans votre espace EDGE.`,
    ),
    cta: { label: "Voir mes résultats", href: params.dashboardHref ?? `${APP_URL}/dashboard/apprenant` },
  });
  return { subject: `Test terminé — ${params.testName}`, html };
}

export function getParticulierBadgeEarnedEmail(params: {
  firstName: string;
  badgeName: string;
  walletHref?: string;
}) {
  const html = buildEdgeEmailShell({
    title: "Badge obtenu",
    preheader: params.badgeName,
    bodyHtml: [
      edgeEmailParagraph(`Félicitations ${params.firstName.trim() || ""}`.trim() + " !"),
      edgeEmailHighlight("Badge EDGE", params.badgeName),
      edgeEmailParagraph("Votre badge est disponible dans votre Wallet."),
    ].join(""),
    cta: { label: "Voir mon Wallet", href: params.walletHref ?? `${APP_URL}/dashboard/apprenant/badges` },
  });
  return { subject: `Badge obtenu — ${params.badgeName}`, html };
}

export type SkillValidationEmailResult =
  | "validated"
  | "pending"
  | "insufficient"
  | "more_info";

export function getParticulierSkillAnalysisEmail(params: {
  firstName: string;
  skillName: string;
  result: SkillValidationEmailResult;
  dashboardHref?: string;
}) {
  const resultLabels: Record<SkillValidationEmailResult, string> = {
    validated: "Compétence validée",
    pending: "Validation en attente",
    insufficient: "Validation insuffisante",
    more_info: "Informations complémentaires demandées",
  };

  const html = buildEdgeEmailShell({
    title: "Analyse terminée",
    preheader: `Compétence ${params.skillName}`,
    bodyHtml: [
      edgeEmailParagraph(
        `Votre compétence « ${params.skillName} » a été analysée par EDGE.`,
      ),
      edgeEmailHighlight("Résultat", resultLabels[params.result]),
    ].join(""),
    cta: {
      label: "Voir mon portefeuille",
      href: params.dashboardHref ?? `${APP_URL}/dashboard/apprenant/profil-comportemental/hard-skills`,
    },
  });

  return {
    subject: `Analyse — ${params.skillName}`,
    html,
  };
}

export function getParticulierSkillValidatedEmail(params: {
  firstName: string;
  skillName: string;
  createBadgeHref?: string;
}) {
  const html = buildEdgeEmailShell({
    title: "Compétence validée",
    preheader: params.skillName,
    bodyHtml: [
      edgeEmailParagraph(`Votre compétence « ${params.skillName} » est validée par EDGE.`),
      edgeEmailParagraph("Vous pouvez créer le badge EDGE associé à cette compétence."),
    ].join(""),
    cta: {
      label: "Créer mon badge EDGE",
      href: params.createBadgeHref ?? `${APP_URL}/dashboard/apprenant/badges`,
    },
  });
  return { subject: `Compétence validée — ${params.skillName}`, html };
}

export function getParticulierNewProofReceivedEmail(params: {
  firstName: string;
  skillName: string;
}) {
  const html = buildEdgeEmailShell({
    title: "Preuve reçue",
    preheader: params.skillName,
    bodyHtml: edgeEmailParagraph(
      `Nous avons bien reçu votre preuve pour la compétence « ${params.skillName} ». L'analyse EDGE est en cours.`,
    ),
    cta: {
      label: "Suivre mon analyse",
      href: `${APP_URL}/dashboard/apprenant/profil-comportemental/hard-skills`,
    },
  });
  return { subject: `Preuve reçue — ${params.skillName}`, html };
}
