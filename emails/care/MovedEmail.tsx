import { CareMessage } from "./CareMessage";
import type { AppointmentCardModel } from "./theme";

export type MovedEmailProps = {
  preheader: string;
  firstName: string;
  previousSlot: string;
  card: AppointmentCardModel;
  agendaUrl: string;
  manageUrl: string;
  infoItems: string[];
};

export function MovedEmail(props: MovedEmailProps) {
  return (
    <CareMessage
      preheader={props.preheader}
      badge="moved"
      firstName={props.firstName}
      title="Votre rendez-vous a été déplacé"
      intro="Le nouveau créneau est ci-dessous."
      previousSlot={props.previousSlot}
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

MovedEmail.PreviewProps = {
  preheader: "Nouveau créneau : vendredi 30 octobre à 12:00.",
  firstName: "Jennifer",
  previousSlot: "Jeudi 29 octobre · 12:00 – 13:00",
  card: {
    variant: "default",
    weekday: "VEN.",
    day: "30",
    month: "oct.",
    timeRange: "12:00 – 13:00",
    serviceLine: "Accompagnement individuel · 1 h",
    practitionerName: "Timmy Darcy",
    practitionerRole: "Votre praticien",
    initials: "TD",
    avatarUrl: null,
    placeTitle: "En visio",
    placeDetail: "Le lien sera actif 15 min avant",
    mapsUrl: null,
  },
  agendaUrl: "https://byoundcare.fr/rdv/exemple/agenda",
  manageUrl: "https://byoundcare.fr/reservation/exemple",
  infoItems: ["Modification ou annulation gratuite jusqu'à 24 h avant.", "Une question ? Répondez simplement à cet email."],
} satisfies MovedEmailProps;

export default MovedEmail;
