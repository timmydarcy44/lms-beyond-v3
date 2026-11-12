import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, type EmailOptions } from "@/lib/email/resend-client";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type OrgOutboundStatus = "envoyé" | "délivré" | "ouvert" | "rejeté";

export type OrgOutboundEmailRow = {
  id: string;
  org_id: string;
  kind: string;
  label: string;
  subject: string;
  to_email: string;
  resend_id: string | null;
  status: OrgOutboundStatus;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  actor_user_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

const KIND_LABELS: Record<string, string> = {
  devis: "Devis",
  convention: "Convention",
  convocation: "Convocation",
  certificat: "Certificat",
  attestation: "Attestation",
  facture: "Facture",
  presentation: "Présentation Sur-mesure",
  invite: "Invitation collaborateur",
  relance: "Relance",
  "formation-request": "Demande de formation",
  "positionnement": "Positionnement",
  "eval-chaud": "Évaluation à chaud",
  "eval-froid": "Évaluation à froid",
  otp: "Code de vérification",
  other: "E-mail",
};

export function orgEmailKindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind.replace(/[-_]/g, " ");
}

export async function recordOrgOutboundEmail(input: {
  orgId: string;
  kind: string;
  subject: string;
  toEmail: string;
  resendId?: string | null;
  label?: string | null;
  actorUserId?: string | null;
  meta?: Record<string, unknown>;
  db?: SupabaseClient | null;
}): Promise<string | null> {
  const db = input.db ?? getServiceRoleClient();
  if (!db) return null;
  const to = input.toEmail.trim().toLowerCase();
  if (!input.orgId || !to.includes("@")) return null;

  const { data, error } = await db
    .from("org_outbound_emails")
    .insert({
      org_id: input.orgId,
      kind: input.kind,
      label: (input.label || orgEmailKindLabel(input.kind)).trim() || "E-mail",
      subject: input.subject.trim() || "(sans objet)",
      to_email: to,
      resend_id: input.resendId?.trim() || null,
      status: "envoyé",
      actor_user_id: input.actorUserId ?? null,
      meta: input.meta ?? {},
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[org-outbound] insert failed:", error.message);
    return null;
  }
  return data?.id ? String(data.id) : null;
}

/** Envoie un e-mail et l'enregistre dans le journal du compte client. */
export async function sendOrgTrackedEmail(
  options: EmailOptions & {
    orgId: string;
    kind: string;
    label?: string | null;
    actorUserId?: string | null;
    meta?: Record<string, unknown>;
    db?: SupabaseClient | null;
  },
): Promise<{ success: boolean; messageId?: string; error?: string; logId?: string | null }> {
  const tags = {
    ...(options.tags ?? {}),
    organization_id: options.orgId,
    kind: options.kind,
  };
  const result = await sendEmail({ ...options, tags });
  if (!result.success) return result;

  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  let logId: string | null = null;
  for (const to of recipients) {
    logId = await recordOrgOutboundEmail({
      orgId: options.orgId,
      kind: options.kind,
      subject: options.subject,
      toEmail: to,
      resendId: result.messageId ?? null,
      label: options.label,
      actorUserId: options.actorUserId,
      meta: options.meta,
      db: options.db,
    });
  }
  return { ...result, logId };
}

export async function markOrgOutboundEmailEvent(input: {
  resendId: string;
  type: "email.delivered" | "email.opened" | "email.bounced" | "email.complained";
  at?: string | null;
  db?: SupabaseClient | null;
}): Promise<boolean> {
  const db = input.db ?? getServiceRoleClient();
  if (!db || !input.resendId) return false;

  const { data: rows, error } = await db
    .from("org_outbound_emails")
    .select("id, status, opened_at, delivered_at")
    .eq("resend_id", input.resendId);

  if (error || !rows?.length) return false;

  const at = input.at || new Date().toISOString();
  const nextStatus: OrgOutboundStatus =
    input.type === "email.opened"
      ? "ouvert"
      : input.type === "email.delivered"
        ? "délivré"
        : "rejeté";

  const rank = ["envoyé", "délivré", "ouvert"];
  let updatedAny = false;

  for (const current of rows) {
    const currentRank = rank.indexOf(String(current.status));
    const nextRank = rank.indexOf(nextStatus);
    if (nextStatus !== "rejeté" && nextRank <= currentRank) continue;

    const patch: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "délivré" && !current.delivered_at) patch.delivered_at = at;
    if (nextStatus === "ouvert") {
      patch.opened_at = current.opened_at || at;
      if (!current.delivered_at) patch.delivered_at = at;
    }

    const updated = await db.from("org_outbound_emails").update(patch).eq("id", current.id);
    if (!updated.error) updatedAny = true;
  }

  return updatedAny;
}
