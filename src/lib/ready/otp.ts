import { createHash, randomInt } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import {
  READY_OTP_BLOCK_MS,
  READY_OTP_MAX_ATTEMPTS,
  READY_OTP_MAX_SENDS_PER_HOUR,
  READY_OTP_SEND_WINDOW_MS,
  READY_OTP_TTL_MS,
} from "@/lib/ready/constants";
import { logReadyEvent } from "@/lib/ready/events";

export function hashReadyOtp(code: string): string {
  return createHash("sha256").update(String(code).trim()).digest("hex");
}

export function newReadyOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

export function maskEmail(email: string): string {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  const at = normalized.indexOf("@");
  if (at < 1) return "***";
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const visible = local.slice(0, Math.min(1, local.length));
  return `${visible}•••••@${domain}`;
}

type LinkOtpRow = {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  status: string;
  expires_at: string;
  blocked_until: string | null;
  otp_hash: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  otp_sent_count_window: number;
  otp_window_started_at: string | null;
};

export async function requestReadyOtp(
  service: SupabaseClient,
  link: LinkOtpRow,
  opts?: { force?: boolean },
): Promise<
  | { ok: true; emailed_to: string; reused?: boolean }
  | { ok: false; error: string; code: string }
> {
  const now = Date.now();
  if (link.status === "revoked" || link.status === "expired") {
    return { ok: false, error: "Ce lien a expiré.", code: "expired" };
  }
  if (Date.parse(link.expires_at) <= now) {
    return { ok: false, error: "Ce lien a expiré.", code: "expired" };
  }
  if (link.blocked_until && Date.parse(link.blocked_until) > now) {
    return {
      ok: false,
      error: "Lien temporairement bloqué. Réessayez plus tard.",
      code: "blocked",
    };
  }

  const to = String(link.recipient_email || "")
    .trim()
    .toLowerCase();
  if (!to.includes("@")) {
    return { ok: false, error: "Destinataire invalide.", code: "no_email" };
  }

  let sentCount = Number(link.otp_sent_count_window || 0);
  let windowStarted = link.otp_window_started_at
    ? Date.parse(link.otp_window_started_at)
    : 0;
  if (!windowStarted || now - windowStarted > READY_OTP_SEND_WINDOW_MS) {
    sentCount = 0;
    windowStarted = now;
  }
  if (sentCount >= READY_OTP_MAX_SENDS_PER_HOUR) {
    return {
      ok: false,
      error: "Trop d'envois de code. Réessayez dans une heure.",
      code: "rate_limited",
    };
  }

  // Ne pas invalider un code encore valide (évite Strict Mode / double mount),
  // sauf si l'utilisateur clique explicitement sur « Renvoyer ».
  const existingExpires = link.otp_expires_at ? Date.parse(link.otp_expires_at) : 0;
  if (!opts?.force && link.otp_hash && existingExpires > now + 30_000) {
    return { ok: true, emailed_to: to, reused: true };
  }

  const otp = newReadyOtpCode();
  const { error } = await service
    .from("ready_links")
    .update({
      otp_hash: hashReadyOtp(otp),
      otp_expires_at: new Date(now + READY_OTP_TTL_MS).toISOString(),
      otp_attempts: 0,
      otp_sent_count_window: sentCount + 1,
      otp_window_started_at: new Date(windowStarted).toISOString(),
      blocked_until: null,
      status: link.status === "blocked" ? "active" : link.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", link.id);

  if (error) return { ok: false, error: error.message, code: "db_error" };

  const hello = (link.recipient_name || "").trim() || "Bonjour";
  const html = buildEdgeEmailShell({
    title: "Code Byound Ready",
    preheader: `Votre code : ${otp}`,
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#111;">${escapeEdgeEmailHtml(hello)},</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#111;">Voici votre code d'accès à la fiche Byound Ready :</p>
      <p style="margin:16px 0;font-size:28px;letter-spacing:0.35em;font-weight:700;color:#111;">${otp}</p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#555;">Valable 10 minutes. Ne le transférez pas.</p>
    `,
    footerNote: "Byound Ready — accès sécurisé à votre fiche OPCO.",
  });

  const result = await sendEmail({
    to,
    from: EDGE_COCKPIT_FROM,
    replyTo: "contact@byound.fr",
    subject: "Votre code Byound Ready",
    html,
    skipBcc: true,
    tags: { type: "ready-otp", link_id: link.id },
  });
  if (!result.success) {
    return { ok: false, error: result.error || "Envoi impossible", code: "email_failed" };
  }

  await logReadyEvent(service, link.id, "otp_sent", { emailed_to: maskEmail(to) });
  return { ok: true, emailed_to: to };
}

export async function verifyReadyOtp(
  service: SupabaseClient,
  link: LinkOtpRow,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string; code: string; attempts_left?: number }> {
  const now = Date.now();
  if (link.status === "revoked" || link.status === "expired") {
    return { ok: false, error: "Ce lien a expiré.", code: "expired" };
  }
  if (Date.parse(link.expires_at) <= now) {
    return { ok: false, error: "Ce lien a expiré.", code: "expired" };
  }
  if (link.blocked_until && Date.parse(link.blocked_until) > now) {
    return { ok: false, error: "Lien temporairement bloqué.", code: "blocked" };
  }
  if (!link.otp_hash || !link.otp_expires_at || Date.parse(link.otp_expires_at) <= now) {
    return { ok: false, error: "Code expiré. Demandez-en un nouveau.", code: "otp_expired" };
  }

  const attempts = Number(link.otp_attempts || 0);
  if (hashReadyOtp(code) !== link.otp_hash) {
    const nextAttempts = attempts + 1;
    const patch: Record<string, unknown> = {
      otp_attempts: nextAttempts,
      updated_at: new Date().toISOString(),
    };
    if (nextAttempts >= READY_OTP_MAX_ATTEMPTS) {
      patch.status = "blocked";
      patch.blocked_until = new Date(now + READY_OTP_BLOCK_MS).toISOString();
      patch.otp_hash = null;
      patch.otp_expires_at = null;
    }
    await service.from("ready_links").update(patch).eq("id", link.id);
    await logReadyEvent(service, link.id, "otp_failure", {
      attempts: nextAttempts,
    });
    if (nextAttempts >= READY_OTP_MAX_ATTEMPTS) {
      return {
        ok: false,
        error: "Trop de tentatives. Lien bloqué 15 minutes.",
        code: "blocked",
        attempts_left: 0,
      };
    }
    return {
      ok: false,
      error: "Code incorrect.",
      code: "invalid_otp",
      attempts_left: READY_OTP_MAX_ATTEMPTS - nextAttempts,
    };
  }

  await service
    .from("ready_links")
    .update({
      otp_hash: null,
      otp_expires_at: null,
      otp_attempts: 0,
      blocked_until: null,
      status: link.status === "blocked" ? "active" : link.status,
      opened_at: link.status === "active" ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", link.id);

  await logReadyEvent(service, link.id, "otp_success", {});
  return { ok: true };
}
