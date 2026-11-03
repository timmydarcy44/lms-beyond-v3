import { sendEmail, resolveAdminBccEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

export const SIGNUP_KINDS = [
  "expert",
  "etudiant",
  "entreprise",
  "patient",
  "nevo",
  "beyond-connect",
  "jessica",
  "achat",
] as const;

export type SignupKind = (typeof SIGNUP_KINDS)[number];

const KIND_LABEL: Record<SignupKind, string> = {
  expert: "Expert",
  etudiant: "Étudiant",
  entreprise: "Entreprise",
  patient: "Patient",
  nevo: "Nevo",
  "beyond-connect": "Beyond Connect",
  jessica: "Jessica Contentin",
  achat: "Achat",
};

const RECENT_ACCOUNT_MS = 20 * 60 * 1000;
const DEDUPE_MS = 30 * 60 * 1000;
const sentAt = new Map<string, number>();

export function isSignupKind(value: unknown): value is SignupKind {
  return typeof value === "string" && (SIGNUP_KINDS as readonly string[]).includes(value);
}

export function isRecentAccount(createdAt: string | null | undefined, now = Date.now()): boolean {
  if (!createdAt) return false;
  const time = new Date(createdAt).getTime();
  if (Number.isNaN(time)) return false;
  const age = now - time;
  return age >= -60_000 && age < RECENT_ACCOUNT_MS;
}

function clip(value: string | null | undefined, max = 200): string {
  return String(value ?? "").trim().slice(0, max);
}

export function buildSignupNoticeEmail(params: {
  kind: SignupKind;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  detail?: string | null;
  registeredAt?: string;
}) {
  const label = KIND_LABEL[params.kind];
  const name = [clip(params.firstName), clip(params.lastName)].filter(Boolean).join(" ") || "—";
  const when = params.registeredAt ?? new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  const rows: Array<[string, string]> = [
    ["Type", label],
    ["Nom", name],
    ["Email", clip(params.email, 320)],
  ];
  const detail = clip(params.detail);
  if (detail) rows.push(["Détail", detail]);
  rows.push(["Date", when]);

  const tableHtml = rows
    .map(
      ([rowLabel, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;font-size:14px;color:#666;vertical-align:top;">${escapeEdgeEmailHtml(rowLabel)}</td><td style="padding:8px 0;font-size:14px;color:#050505;font-weight:500;">${escapeEdgeEmailHtml(value)}</td></tr>`,
    )
    .join("");

  const html = buildEdgeEmailShell({
    title: `Nouvelle inscription · ${label}`,
    preheader: `${name} — ${clip(params.email, 320)}`,
    bodyHtml: `<p>Une nouvelle inscription vient d’être enregistrée.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0;width:100%;">${tableHtml}</table>`,
    footerNote: "Notification automatique — Byound",
  });

  return {
    to: resolveAdminBccEmail() ?? "timmydarcy44@gmail.com",
    subject: `Nouvelle inscription · ${label}`,
    html,
  };
}

function recentlyNotified(key: string, now: number): boolean {
  const previous = sentAt.get(key);
  if (previous && now - previous < DEDUPE_MS) return true;
  if (sentAt.size > 500) {
    for (const [entry, at] of sentAt) {
      if (now - at > DEDUPE_MS) sentAt.delete(entry);
    }
  }
  return false;
}

/** Avertit l’admin. N’interrompt jamais l’inscription si l’envoi échoue. */
export async function notifyOwnerOfSignup(params: {
  kind: SignupKind;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  detail?: string | null;
}): Promise<void> {
  const email = clip(params.email, 320).toLowerCase();
  if (!email.includes("@")) return;
  const key = `${params.kind}:${email}`;
  const now = Date.now();
  if (recentlyNotified(key, now)) return;

  const template = buildSignupNoticeEmail({ ...params, email });
  const result = await sendEmail({
    to: template.to,
    subject: template.subject,
    html: template.html,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
  });
  if (!result.success) {
    console.error("[signup-notice]", params.kind, result.error);
    return;
  }
  sentAt.set(key, now);
}
