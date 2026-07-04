import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";
import { formatEurosFromCents } from "@/lib/marketplace/commission";
import { marketplaceAppOrigin } from "@/lib/marketplace/stripe";

function formatSessionDate(date: string, heure: string) {
  const d = new Date(`${date}T${heure}`);
  if (Number.isNaN(d.getTime())) return `${date} à ${heure}`;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export async function sendSessionConfirmationEmails(params: {
  sessionId: string;
  praticienPrenom: string;
  praticienNom: string;
  praticienEmail: string;
  collaborateurPrenom: string;
  collaborateurEmail: string;
  dateSession: string;
  heureDebut: string;
  dureeMinutes: number;
  montantPraticienCents: number;
  consentementDonnees: boolean;
}) {
  const origin = marketplaceAppOrigin();
  const when = formatSessionDate(params.dateSession, params.heureDebut);
  const praticienNomComplet = `${params.praticienPrenom} ${params.praticienNom}`.trim();

  const collaborateurHtml = buildEdgeEmailShell({
    title: "Votre séance est confirmée",
    preheader: `Séance avec ${praticienNomComplet} — ${when}`,
    bodyHtml: `<p>Bonjour ${params.collaborateurPrenom},</p>
      <p>Votre séance est confirmée :</p>
      <ul style="margin:16px 0;padding-left:20px;">
        <li>${when}</li>
        <li>${praticienNomComplet} — Psychopédagogue BCT</li>
        <li>${params.dureeMinutes} minutes</li>
        <li>En visioconférence (lien envoyé 15 min avant)</li>
      </ul>
      <p style="font-size:14px;">Vous pouvez annuler jusqu'à 24 h avant sans frais.</p>`,
    cta: { label: "Accéder à ma session", href: `${origin}/dashboard/salarie` },
  });

  await sendEmail({
    from: "Timmy Darcy <darcy@edgebs.fr>",
    to: params.collaborateurEmail,
    subject: `Votre séance avec ${params.praticienPrenom} ${params.praticienNom} est confirmée`,
    html: collaborateurHtml,
  });

  const profilBlock = params.consentementDonnees
    ? `<p>Le collaborateur a autorisé l'accès à son profil Beyond.</p>`
    : `<p>Le collaborateur n'a pas partagé son profil Beyond.</p>`;

  const praticienHtml = buildEdgeEmailShell({
    title: "Nouvelle réservation",
    preheader: `Session le ${when}`,
    bodyHtml: `<p>Bonjour ${params.praticienPrenom},</p>
      <p>Une nouvelle session vient d'être réservée :</p>
      <ul style="margin:16px 0;padding-left:20px;">
        <li>${when}</li>
        <li>${params.collaborateurPrenom}</li>
      </ul>
      ${profilBlock}
      <p>Revenus de cette session : <strong>${formatEurosFromCents(params.montantPraticienCents)}</strong></p>`,
    cta: { label: "Voir mon tableau de bord", href: `${origin}/dashboard/praticien` },
  });

  await sendEmail({
    from: "Beyond <noreply@edgebs.fr>",
    to: params.praticienEmail,
    subject: `Nouvelle réservation — ${when}`,
    html: praticienHtml,
  });
}
