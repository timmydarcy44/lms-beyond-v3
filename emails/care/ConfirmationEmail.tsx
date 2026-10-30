import { CareMessage } from "./CareMessage";
import type { AppointmentCardModel } from "./theme";

export type ConfirmationEmailProps = {
  preheader: string;
  firstName: string;
  card: AppointmentCardModel;
  agendaUrl: string;
  manageUrl: string;
  infoItems: string[];
};

export function ConfirmationEmail(props: ConfirmationEmailProps) {
  return (
    <CareMessage
      preheader={props.preheader}
      badge="confirmed"
      firstName={props.firstName}
      title="C'est confirmé"
      intro="Votre rendez-vous est réservé. Tout est résumé ci-dessous."
      card={props.card}
      buttons={[
        { href: props.agendaUrl, label: "Ajouter à mon agenda", tone: "primary" },
        { href: props.manageUrl, label: "Modifier ou annuler", tone: "secondary" },
      ]}
      infoTitle="Bon à savoir"
      infoItems={props.infoItems}
    />
  );
}

const sampleCard: AppointmentCardModel = {
  variant: "default",
  weekday: "JEU.",
  day: "29",
  month: "oct.",
  timeRange: "12:00 – 13:00",
  serviceLine: "Accompagnement individuel · 1 h",
  practitionerName: "Timmy Darcy",
  practitionerRole: "Votre praticien",
  initials: "TD",
  avatarUrl: null,
  placeTitle: "Cabinet de Timmy Darcy",
  placeDetail: "14 rue du Cabinet, 14000 Caen",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=14%20rue%20du%20Cabinet%2014000%20Caen",
};

ConfirmationEmail.PreviewProps = {
  preheader: "Avec Timmy Darcy, au cabinet à Caen. Ajoutez-le à votre agenda.",
  firstName: "Jennifer",
  card: sampleCard,
  agendaUrl: "https://byoundcare.fr/rdv/exemple/agenda",
  manageUrl: "https://byoundcare.fr/reservation/exemple",
  infoItems: [
    "Arrivez 5 minutes avant l'heure.",
    "Modification ou annulation gratuite jusqu'à 24 h avant.",
    "Une question ? Répondez simplement à cet email.",
  ],
} satisfies ConfirmationEmailProps;

export default ConfirmationEmail;
