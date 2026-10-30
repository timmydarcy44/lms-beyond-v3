import { AppointmentCard } from "./AppointmentCard";
import { CareButton } from "./Button";
import { CareLayout } from "./CareLayout";
import { InfoBox } from "./InfoBox";
import { StatusBadge } from "./StatusBadge";
import { careTheme, type AppointmentCardModel, type CareBadgeKind } from "./theme";

export function CareMessage({
  preheader,
  badge,
  firstName,
  title,
  intro,
  card,
  previousSlot,
  buttons,
  infoTitle,
  infoItems,
}: {
  preheader: string;
  badge: CareBadgeKind;
  firstName: string;
  title: string;
  intro: string;
  card?: AppointmentCardModel;
  previousSlot?: string | null;
  buttons?: Array<{ href: string; label: string; tone: "primary" | "secondary" | "dark" }>;
  infoTitle?: string;
  infoItems?: string[];
}) {
  return (
    <CareLayout preheader={preheader}>
      <StatusBadge kind={badge} />
      <p style={greeting}>Bonjour{firstName ? ` ${firstName}` : ""},</p>
      <h1 style={heading}>{title}</h1>
      <p style={introStyle}>{intro}</p>
      {previousSlot ? <p style={struck}>{previousSlot}</p> : null}
      {card ? <AppointmentCard {...card} /> : null}
      {buttons?.map((button) => (
        <CareButton key={button.label} href={button.href} label={button.label} tone={button.tone} />
      ))}
      {infoTitle && infoItems?.length ? <InfoBox title={infoTitle} items={infoItems} /> : null}
    </CareLayout>
  );
}

const greeting = {
  margin: "18px 0 0",
  color: careTheme.muted,
  fontFamily: careTheme.font,
  fontSize: "15px",
  lineHeight: "22px",
};

const heading = {
  margin: "8px 0 0",
  color: careTheme.ink,
  fontFamily: careTheme.font,
  fontSize: "28px",
  fontWeight: 800,
  letterSpacing: "-0.7px",
  lineHeight: "34px",
};

const introStyle = {
  margin: "10px 0 0",
  color: careTheme.ink,
  fontFamily: careTheme.font,
  fontSize: "15px",
  lineHeight: "22px",
};

const struck = {
  margin: "12px 0 0",
  color: careTheme.faint,
  fontFamily: careTheme.font,
  fontSize: "14px",
  lineHeight: "20px",
  textDecoration: "line-through",
};
