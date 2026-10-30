export const careTheme = {
  berry: "#CE0058",
  berryDark: "#9C0049",
  blush: "#F7D9E5",
  ink: "#1F1F24",
  body: "#3F3F46",
  muted: "#5A5A62",
  quiet: "#6B6B72",
  faint: "#8A8A92",
  canvas: "#FBF8F6",
  card: "#FFFFFF",
  line: "#EEE6E1",
  panel: "#F3EEEA",
  buttonLine: "#E2D9D3",
  place: "#F1ECE8",
  font: "Manrope, Arial, Helvetica, sans-serif",
  care: "Inter, Manrope, Arial, Helvetica, sans-serif",
} as const;

export type CareBadgeKind = "confirmed" | "reminder" | "cancelled" | "moved" | "document";

export type CareCardVariant = "default" | "reminder" | "cancelled";

export type AppointmentCardModel = {
  variant: CareCardVariant;
  weekday: string;
  day: string;
  month: string;
  timeRange: string;
  serviceLine: string;
  practitionerName: string;
  practitionerRole: string;
  initials: string;
  avatarUrl: string | null;
  placeTitle: string;
  placeDetail: string | null;
  mapsUrl: string | null;
};
