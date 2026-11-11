import type { SupabaseClient } from "@supabase/supabase-js";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import {
  READY_AFTER_SUBMITTED_DAYS,
  READY_DEPOSIT_AFTER_SEND_DAYS,
  READY_DEPOSIT_BEFORE_SESSION_DAYS,
  READY_LINK_MAX_DAYS,
} from "@/lib/ready/constants";
import { encryptJson, hashReadyToken, newReadyToken } from "@/lib/ready/crypto";
import { logReadyEvent } from "@/lib/ready/events";

function addDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function computeExpiresAt(params: {
  createdAt?: Date;
  sessionStart: Date | null;
  submittedAt?: Date | null;
}): Date {
  const created = params.createdAt ?? new Date();
  const absolute = addDays(created, READY_LINK_MAX_DAYS);
  const candidates: Date[] = [absolute];
  if (params.sessionStart) candidates.push(params.sessionStart);
  if (params.submittedAt) {
    candidates.push(addDays(params.submittedAt, READY_AFTER_SUBMITTED_DAYS));
  }
  return new Date(Math.min(...candidates.map((d) => d.getTime())));
}

export function computeDepositDeadline(params: {
  sessionStart: Date | null;
  devisSentAt: Date | null;
}): Date {
  if (params.sessionStart) {
    return addDays(params.sessionStart, -READY_DEPOSIT_BEFORE_SESSION_DAYS);
  }
  const base = params.devisSentAt ?? new Date();
  return addDays(base, READY_DEPOSIT_AFTER_SEND_DAYS);
}

export function readyPublicUrl(token: string): string {
  return `${BYOUND_PUBLIC_ORIGIN}/ready/${token}`;
}

async function resolveSessionStart(
  service: SupabaseClient,
  dossierId: string,
): Promise<Date | null> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("session_id")
    .eq("id", dossierId)
    .maybeSingle();
  if (!dossier?.session_id) {
    const { data: slots } = await service
      .from("formation_slots")
      .select("slot_date, starts_at")
      .eq("dossier_id", dossierId)
      .order("slot_date", { ascending: true })
      .limit(1);
    const first = slots?.[0];
    if (first?.starts_at) return new Date(String(first.starts_at));
    if (first?.slot_date) return new Date(`${first.slot_date}T08:00:00.000Z`);
    return null;
  }
  const { data: slots } = await service
    .from("formation_slots")
    .select("slot_date, starts_at")
    .eq("session_id", dossier.session_id)
    .order("slot_date", { ascending: true })
    .limit(1);
  const first = slots?.[0];
  if (first?.starts_at) return new Date(String(first.starts_at));
  if (first?.slot_date) return new Date(`${first.slot_date}T08:00:00.000Z`);
  return null;
}

async function syncLearners(
  service: SupabaseClient,
  linkId: string,
  dossierId: string,
): Promise<number> {
  const { data: parts } = await service
    .from("formation_participants")
    .select("id, profile_id, job_title")
    .eq("dossier_id", dossierId)
    .order("created_at", { ascending: true });

  const profileIds = (parts ?? []).map((p) => String(p.profile_id)).filter(Boolean);
  const { data: profiles } = profileIds.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, date_of_birth")
        .in("id", profileIds)
    : { data: [] as Array<Record<string, unknown>> };
  const byId = new Map((profiles ?? []).map((p) => [String(p.id), p]));

  await service.from("ready_learners").delete().eq("link_id", linkId);

  let order = 0;
  for (const p of parts ?? []) {
    const profile = byId.get(String(p.profile_id));
    const first =
      String(profile?.first_name || "").trim() ||
      String(profile?.full_name || "")
        .trim()
        .split(/\s+/)[0] ||
      "";
    const last =
      String(profile?.last_name || "").trim() ||
      String(profile?.full_name || "")
        .trim()
        .split(/\s+/)
        .slice(1)
        .join(" ") ||
      "";
    const dob = profile?.date_of_birth ? String(profile.date_of_birth) : null;
    let fieldsEnc: Buffer | null = null;
    try {
      fieldsEnc = encryptJson({
        sex: "",
        date_of_birth: dob || "",
        contract_type: "",
        csp: "",
        entry_date: "",
        diploma_level: "",
        hours: "",
        on_work_time: null,
      });
    } catch (e) {
      console.warn("[ready] encrypt learner skipped:", e);
    }

    await service.from("ready_learners").insert({
      link_id: linkId,
      participant_id: p.id,
      profile_id: p.profile_id,
      first_name: first,
      last_name: last,
      fields_enc: fieldsEnc,
      sort_order: order++,
    });
  }
  return order;
}

export async function ensureReadyLink(
  service: SupabaseClient,
  params: {
    dossierId: string;
    documentId: string;
    recipientEmail: string;
    recipientName?: string | null;
  },
): Promise<{ linkId: string; token: string; url: string; reused: boolean }> {
  const email = params.recipientEmail.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("E-mail destinataire Ready invalide");
  }

  const sessionStart = await resolveSessionStart(service, params.dossierId);
  const now = new Date();

  const { data: existing } = await service
    .from("ready_links")
    .select("id, recipient_email, status, expires_at, token_hash, submitted_at")
    .eq("document_id", params.documentId)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    const sameEmail =
      String(existing.recipient_email || "")
        .trim()
        .toLowerCase() === email;
    if (sameEmail && Date.parse(String(existing.expires_at)) > now.getTime()) {
      // Réutilisation : on ne peut pas renvoyer le token clair — en générer un nouveau
      // tout en conservant l'id / saisies, car seul le hash est stocké.
      const token = newReadyToken();
      const expiresAt = computeExpiresAt({
        createdAt: now,
        sessionStart,
        submittedAt: existing.submitted_at ? new Date(String(existing.submitted_at)) : null,
      });
      const learnerCount = await syncLearners(service, String(existing.id), params.dossierId);
      await service
        .from("ready_links")
        .update({
          token_hash: hashReadyToken(token),
          recipient_name: params.recipientName ?? null,
          expires_at: expiresAt.toISOString(),
          progress_total: Math.max(learnerCount, 1),
          // Nouveau lien e-mail → reset OTP (évite « trop d'envois » après un renvoi).
          otp_hash: null,
          otp_expires_at: null,
          otp_attempts: 0,
          otp_sent_count_window: 0,
          otp_window_started_at: null,
          blocked_until: null,
          updated_at: now.toISOString(),
        })
        .eq("id", existing.id);
      await logReadyEvent(service, String(existing.id), "resent", {
        recipient_email_domain: email.split("@")[1] || null,
      });
      return {
        linkId: String(existing.id),
        token,
        url: readyPublicUrl(token),
        reused: true,
      };
    }

    // Destinataire changé ou expiré → révoquer
    await service
      .from("ready_links")
      .update({
        status: "revoked",
        revoked_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", existing.id);
    await logReadyEvent(service, String(existing.id), "revoked", {
      reason: sameEmail ? "expired_reuse" : "recipient_changed",
    });
  }

  const token = newReadyToken();
  const expiresAt = computeExpiresAt({ createdAt: now, sessionStart });
  const { data: inserted, error } = await service
    .from("ready_links")
    .insert({
      dossier_id: params.dossierId,
      document_id: params.documentId,
      token_hash: hashReadyToken(token),
      recipient_email: email,
      recipient_name: params.recipientName ?? null,
      status: "active",
      expires_at: expiresAt.toISOString(),
      payment_mode: "subrogation",
      progress_ready: 0,
      progress_total: 0,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Création lien Ready impossible");
  }

  const learnerCount = await syncLearners(service, String(inserted.id), params.dossierId);
  await service
    .from("ready_links")
    .update({
      progress_total: Math.max(learnerCount * 4 + 4, 1),
      updated_at: now.toISOString(),
    })
    .eq("id", inserted.id);

  await logReadyEvent(service, String(inserted.id), "created", {
    recipient_email_domain: email.split("@")[1] || null,
  });

  return {
    linkId: String(inserted.id),
    token,
    url: readyPublicUrl(token),
    reused: false,
  };
}

export async function revokeReadyLink(
  service: SupabaseClient,
  linkId: string,
): Promise<void> {
  await service
    .from("ready_links")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", linkId);
  await logReadyEvent(service, linkId, "revoked", { reason: "manual" });
}

export async function purgeExpiredReadyLinks(
  service: SupabaseClient,
  limit = 50,
): Promise<{ purged: number }> {
  const nowIso = new Date().toISOString();
  const { data: rows } = await service
    .from("ready_links")
    .select("id, status, expires_at, purged_at")
    .or(
      `status.eq.revoked,status.eq.expired,and(status.in.(active,blocked,submitted),expires_at.lte.${nowIso})`,
    )
    .is("purged_at", null)
    .limit(limit);

  let purged = 0;
  for (const row of rows ?? []) {
    await service.from("ready_learners").update({ fields_enc: null }).eq("link_id", row.id);
    await service
      .from("ready_links")
      .update({
        company_fields_enc: null,
        otp_hash: null,
        status: row.status === "revoked" ? "revoked" : "expired",
        purged_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", row.id);
    await logReadyEvent(service, String(row.id), "purged", {});
    if (row.status !== "revoked" && row.status !== "expired") {
      await logReadyEvent(service, String(row.id), "expired", {});
    }
    purged += 1;
  }
  return { purged };
}
