import { sendEmail } from "@/lib/email/resend-client";
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

  await sendEmail({
    from: "Timmy Darcy <darcy@edgebs.fr>",
    to: params.collaborateurEmail,
    subject: `Votre séance avec ${params.praticienPrenom} ${params.praticienNom} est confirmée`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;line-height:1.5;color:#111">
        <p>Bonjour ${params.collaborateurPrenom},</p>
        <p>Votre séance est confirmée :</p>
        <ul>
          <li>📅 ${when}</li>
          <li>👤 ${praticienNomComplet} — Psychopédagogue BCT</li>
          <li>⏱ ${params.dureeMinutes} minutes</li>
          <li>💻 En visioconférence (lien envoyé 15 min avant)</li>
        </ul>
        <p><a href="${origin}/dashboard/salarie">Accéder à ma session →</a></p>
        <p style="color:#666;font-size:13px">Vous pouvez annuler jusqu'à 24h avant sans frais.</p>
      </div>
    `,
  });

  const profilBlock = params.consentementDonnees
    ? `<p>Le collaborateur a autorisé l'accès à son profil Beyond.<br>
       <a href="${origin}/dashboard/praticien">Voir le profil avant la séance →</a></p>`
    : `<p>Le collaborateur n'a pas partagé son profil Beyond.</p>`;

  await sendEmail({
    from: "Beyond <noreply@edgebs.fr>",
    to: params.praticienEmail,
    subject: `Nouvelle réservation — ${when}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;line-height:1.5;color:#111">
        <p>Bonjour ${params.praticienPrenom},</p>
        <p>Une nouvelle session vient d'être réservée :</p>
        <ul>
          <li>📅 ${when}</li>
          <li>👤 ${params.collaborateurPrenom}</li>
        </ul>
        ${profilBlock}
        <p>Revenus de cette session : <strong>${formatEurosFromCents(params.montantPraticienCents)}</strong></p>
        <p><a href="${origin}/dashboard/praticien">Accéder à mon tableau de bord →</a></p>
      </div>
    `,
  });
}
