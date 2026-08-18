export const QUALIOPI_DOC_KINDS = ["convention", "reglement", "livret", "autre"] as const;
export type QualiopiDocKind = (typeof QUALIOPI_DOC_KINDS)[number];

export const QUALIOPI_CORE_DOCS: { kind: Exclude<QualiopiDocKind, "autre">; title: string }[] = [
  { kind: "convention", title: "Convention de formation" },
  { kind: "reglement", title: "Règlement intérieur" },
  { kind: "livret", title: "Livret d'accueil" },
];

export type QualiopiDocument = {
  id: string;
  kind: QualiopiDocKind;
  title: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
};

export type QualiopiAttendee = {
  id: string;
  session_id: string;
  full_name: string;
  email: string;
  token: string;
  signed_at: string | null;
  created_at: string;
};

export type QualiopiSession = {
  id: string;
  deal_id: string;
  course_id: string | null;
  course_name: string;
  scheduled_at: string | null;
  status: "scheduled" | "in_progress" | "done";
  convention_sent_at: string | null;
  reglement_sent_at: string | null;
  livret_sent_at: string | null;
  emargement_sent_at: string | null;
  created_at: string;
  attendees?: QualiopiAttendee[];
};

export type QualiopiInviteeInput = {
  full_name: string;
  email: string;
};

export function qualiopiKindLabel(kind: QualiopiDocKind) {
  if (kind === "convention") return "Convention de formation";
  if (kind === "reglement") return "Règlement intérieur";
  if (kind === "livret") return "Livret d'accueil";
  return "Autre document";
}

export function formatSignedAt(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hour = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return { day, hour, label: `${day} à ${hour}` };
}

export function qualiopiAppBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://edgebs.fr").replace(/\/$/, "");
}
