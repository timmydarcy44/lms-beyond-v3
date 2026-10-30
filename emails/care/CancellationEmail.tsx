import { CareMessage } from "./CareMessage";
import type { AppointmentCardModel } from "./theme";

export type CancellationEmailProps = {
  preheader: string;
  firstName: string;
  intro: string;
  card: AppointmentCardModel;
  rebookUrl: string;
};

export function CancellationEmail(props: CancellationEmailProps) {
  return (
    <CareMessage
      preheader={props.preheader}
      badge="cancelled"
      firstName={props.firstName}
      title="Votre rendez-vous est annulé"
      intro={props.intro}
      card={{ ...props.card, variant: "cancelled", mapsUrl: null }}
      buttons={[{ href: props.rebookUrl, label: "Reprendre rendez-vous", tone: "dark" }]}
    />
  );
}

CancellationEmail.PreviewProps = {
  preheader: "Votre créneau a bien été libéré. Reprenez rendez-vous quand vous voulez.",
  firstName: "Jennifer",
  intro: "C'est noté, le créneau ci-dessous a été libéré. Aucun frais.",
  card: {
    variant: "cancelled",
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
    mapsUrl: null,
  },
  rebookUrl: "https://byoundcare.fr/praticiens/timmy-darcy",
} satisfies CancellationEmailProps;

export default CancellationEmail;
