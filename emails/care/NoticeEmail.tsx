import { CareMessage } from "./CareMessage";
import type { AppointmentCardModel, CareBadgeKind } from "./theme";

export function NoticeEmail(props: {
  preheader: string;
  firstName: string;
  title: string;
  intro: string;
  card: AppointmentCardModel;
  buttonLabel: string;
  buttonUrl: string;
  badge?: CareBadgeKind;
}) {
  return (
    <CareMessage
      preheader={props.preheader}
      badge={props.badge ?? "confirmed"}
      firstName={props.firstName}
      title={props.title}
      intro={props.intro}
      card={props.card}
      buttons={[{ href: props.buttonUrl, label: props.buttonLabel, tone: "primary" }]}
    />
  );
}
