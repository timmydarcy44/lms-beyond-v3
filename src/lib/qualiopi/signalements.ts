import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";

export const SIGNALEMENT_CATEGORIES = [
  "violence",
  "harcelement",
  "discrimination",
  "autre_sensible",
] as const;
export type SignalementCategory = (typeof SIGNALEMENT_CATEGORIES)[number];

export const SIGNALEMENT_STATUSES = [
  "received",
  "acked",
  "in_progress",
  "closed",
] as const;
export type SignalementStatus = (typeof SIGNALEMENT_STATUSES)[number];

export const SIGNALEMENT_CATEGORY_LABELS: Record<SignalementCategory, string> = {
  violence: "Violence",
  harcelement: "Harcèlement",
  discrimination: "Discrimination",
  autre_sensible: "Autre (sensible)",
};

export const SIGNALEMENT_STATUS_LABELS: Record<SignalementStatus, string> = {
  received: "Reçu",
  acked: "Accusé de réception",
  in_progress: "En traitement",
  closed: "Clos",
};

const OF_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

export function parseSignalementCategory(v: unknown): SignalementCategory | null {
  const s = String(v ?? "").trim();
  return (SIGNALEMENT_CATEGORIES as readonly string[]).includes(s)
    ? (s as SignalementCategory)
    : null;
}

export function parseSignalementStatus(v: unknown): SignalementStatus | null {
  const s = String(v ?? "").trim();
  return (SIGNALEMENT_STATUSES as readonly string[]).includes(s)
    ? (s as SignalementStatus)
    : null;
}

export type SignalementRow = {
  id: string;
  category: SignalementCategory;
  subject: string;
  description: string;
  status: SignalementStatus;
  is_anonymous: boolean;
  requester_name: string | null;
  requester_email: string | null;
  audience: string | null;
  dossier_id: string | null;
  received_at: string;
  ack_at: string | null;
  in_progress_at: string | null;
  closed_at: string | null;
  response: string | null;
  internal_notes: string | null;
  signalement_ack_business_days?: number;
};

export async function loadSignalementSettings(service: SupabaseClient): Promise<{
  referentUserId: string | null;
  referentEmail: string | null;
  ackBusinessDays: number;
}> {
  const { data } = await service
    .from("of_settings")
    .select("referent_signalement_user_id, signalement_ack_business_days")
    .eq("id", OF_SETTINGS_ID)
    .maybeSingle();
  const referentUserId = data?.referent_signalement_user_id
    ? String(data.referent_signalement_user_id)
    : null;
  let referentEmail: string | null = null;
  if (referentUserId) {
    const { data: profile } = await service
      .from("profiles")
      .select("email")
      .eq("id", referentUserId)
      .maybeSingle();
    referentEmail = profile?.email ? String(profile.email) : null;
  }
  const ack = Number(data?.signalement_ack_business_days ?? 2);
  return {
    referentUserId,
    referentEmail,
    ackBusinessDays: Number.isFinite(ack) && ack >= 1 ? Math.floor(ack) : 2,
  };
}

export async function createSignalement(
  service: SupabaseClient,
  params: {
    category: SignalementCategory;
    subject: string;
    description: string;
    isAnonymous?: boolean;
    requesterUserId?: string | null;
    requesterName?: string | null;
    requesterEmail?: string | null;
    audience?: string | null;
    dossierId?: string | null;
  },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const anonymous = Boolean(params.isAnonymous);
  const now = new Date().toISOString();
  const { data, error } = await service
    .from("crm_qualiopi_signalements")
    .insert({
      category: params.category,
      subject: params.subject.trim(),
      description: params.description.trim(),
      is_anonymous: anonymous,
      requester_user_id: anonymous ? null : params.requesterUserId ?? null,
      requester_name: anonymous ? null : params.requesterName?.trim() || null,
      requester_email: anonymous ? null : params.requesterEmail?.trim() || null,
      audience: params.audience ?? null,
      dossier_id: params.dossierId ?? null,
      status: "received",
      received_at: now,
    })
    .select("id")
    .maybeSingle();
  if (error || !data?.id) {
    return { ok: false, error: error?.message || "Enregistrement impossible" };
  }

  await service.from("crm_qualiopi_signalement_events").insert({
    signalement_id: data.id,
    event_type: "created",
    actor_user_id: anonymous ? null : params.requesterUserId ?? null,
    payload: { category: params.category, anonymous },
  });

  // Notification référent (best-effort)
  try {
    const settings = await loadSignalementSettings(service);
    if (settings.referentEmail) {
      await sendEmail({
        to: settings.referentEmail,
        skipBcc: true,
        subject: `[Qualiopi] Nouveau signalement sensible — ${SIGNALEMENT_CATEGORY_LABELS[params.category]}`,
        html: `<p>Un signalement sensible a été enregistré.</p>
<p><strong>Catégorie :</strong> ${SIGNALEMENT_CATEGORY_LABELS[params.category]}</p>
<p><strong>Objet :</strong> ${params.subject.replace(/</g, "&lt;")}</p>
<p><strong>Anonyme :</strong> ${anonymous ? "oui" : "non"}</p>
<p>Traitez-le dans Qualiopi → Qualité → Signalements. Accusé de réception cible : ${settings.ackBusinessDays} jour(s) ouvré(s).</p>`,
      });
      await service
        .from("crm_qualiopi_signalements")
        .update({ notified_referent_at: now })
        .eq("id", data.id);
      await service.from("crm_qualiopi_signalement_events").insert({
        signalement_id: data.id,
        event_type: "notified",
        payload: { to: settings.referentEmail },
      });
    }
  } catch (e) {
    console.warn("[signalements] notify referent:", e);
  }

  return { ok: true, id: String(data.id) };
}

export async function transitionSignalement(
  service: SupabaseClient,
  params: {
    id: string;
    status: SignalementStatus;
    actorUserId?: string | null;
    response?: string | null;
    internalNotes?: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: params.status,
    updated_at: now,
  };
  if (params.status === "acked") patch.ack_at = now;
  if (params.status === "in_progress") {
    patch.in_progress_at = now;
    if (!params.response) {
      /* keep */
    }
  }
  if (params.status === "closed") patch.closed_at = now;
  if (params.response !== undefined) patch.response = params.response?.trim() || null;
  if (params.internalNotes !== undefined) {
    patch.internal_notes = params.internalNotes?.trim() || null;
  }

  const { error } = await service
    .from("crm_qualiopi_signalements")
    .update(patch)
    .eq("id", params.id);
  if (error) return { ok: false, error: error.message };

  const eventType =
    params.status === "acked"
      ? "acked"
      : params.status === "in_progress"
        ? "in_progress"
        : params.status === "closed"
          ? "closed"
          : "note";
  await service.from("crm_qualiopi_signalement_events").insert({
    signalement_id: params.id,
    event_type: eventType,
    actor_user_id: params.actorUserId ?? null,
    payload: { status: params.status },
  });

  return { ok: true };
}
