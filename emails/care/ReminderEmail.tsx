import { CareMessage } from "./CareMessage";
import type { AppointmentCardModel } from "./theme";

export type ReminderEmailProps = {
  preheader: string;
  firstName: string;
  card: AppointmentCardModel;
  primaryLabel: string;
  primaryUrl: string;
  manageUrl: string;
  infoItems: string[];
};

export function ReminderEmail(props: ReminderEmailProps) {
  return (
    <CareMessage
      preheader={props.preheader}
      badge="reminder"
      firstName={props.firstName}
      title={`À demain, ${props.firstName}`}
      intro="Un petit rappel pour votre rendez-vous de demain."
      card={{ ...props.card, variant: "reminder" }}
      buttons={[
        { href: props.primaryUrl, label: props.primaryLabel, tone: "primary" },
        { href: props.manageUrl, label: "Je ne peux plus venir", tone: "secondary" },
      ]}
      infoTitle="Pour demain"
      infoItems={props.infoItems}
    />
  );
}

ReminderEmail.PreviewProps = {
  preheader: "Au cabinet à Caen, avec Timmy Darcy. Itinéraire dans l'email.",
  firstName: "Jennifer",
  card: {
    variant: "reminder",
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
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Caen",
  },
  primaryLabel: "Voir l'itinéraire",
  primaryUrl: "https://www.google.com/maps/search/?api=1&query=Caen",
  manageUrl: "https://byoundcare.fr/reservation/exemple",
  infoItems: ["Durée : 1 heure.", "Annulation encore possible jusqu'au mercredi 28 octobre à 12:00."],
} satisfies ReminderEmailProps;

export default ReminderEmail;
