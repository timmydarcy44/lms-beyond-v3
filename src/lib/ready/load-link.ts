import type { SupabaseClient } from "@supabase/supabase-js";
import { hashReadyToken } from "@/lib/ready/crypto";

export type ReadyLinkRow = {
  id: string;
  dossier_id: string;
  document_id: string;
  token_hash: string;
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
  submitted_at: string | null;
  opened_at: string | null;
  payment_mode: string | null;
  purged_at: string | null;
};

export async function loadReadyLinkByToken(
  service: SupabaseClient,
  token: string,
): Promise<ReadyLinkRow | null> {
  const tokenHash = hashReadyToken(token);
  const { data } = await service
    .from("ready_links")
    .select(
      "id, dossier_id, document_id, token_hash, recipient_email, recipient_name, status, expires_at, blocked_until, otp_hash, otp_expires_at, otp_attempts, otp_sent_count_window, otp_window_started_at, submitted_at, opened_at, payment_mode, purged_at",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();
  return (data as ReadyLinkRow | null) ?? null;
}

export function isReadyLinkAccessible(link: ReadyLinkRow): {
  ok: boolean;
  reason?: "expired" | "revoked" | "blocked";
} {
  const now = Date.now();
  if (link.status === "revoked") return { ok: false, reason: "revoked" };
  if (link.status === "expired" || Date.parse(link.expires_at) <= now) {
    return { ok: false, reason: "expired" };
  }
  if (link.blocked_until && Date.parse(link.blocked_until) > now) {
    return { ok: false, reason: "blocked" };
  }
  return { ok: true };
}
