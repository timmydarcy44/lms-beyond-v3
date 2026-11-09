import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

export const ACCEPT_OTP_TTL_MS = 10 * 60 * 1000;
export const ACCEPT_OTP_MAX_ATTEMPTS = 5;
export const ACCEPT_OTP_RESEND_COOLDOWN_MS = 45 * 1000;

export function hashAcceptOtp(code: string): string {
  return createHash("sha256").update(String(code).trim()).digest("hex");
}

export function newAcceptOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function maskEmail(email: string): string {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  const at = normalized.indexOf("@");
  if (at < 1) return "***";
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export async function issueAcceptOtp(params: {
  service: SupabaseClient;
  documentId: string;
  toEmail: string;
  recipientName?: string | null;
  kind: "devis" | "convention";
  courseTitle?: string | null;
}): Promise<{ ok: true; emailed_to: string } | { ok: false; error: string; code?: string }> {
  const to = params.toEmail.trim().toLowerCase();
  if (!to.includes("@")) {
    return { ok: false, error: "E-mail contact manquant sur le dossier.", code: "no_contact_email" };
  }

  const { data: current } = await params.service
    .from("formation_documents")
    .select("accept_otp_expires_at, accept_otp_sent_to, updated_at")
    .eq("id", params.documentId)
    .maybeSingle();

  const expiresAt = current?.accept_otp_expires_at
    ? Date.parse(String(current.accept_otp_expires_at))
    : 0;
  // Anti-spam : si un code encore valide a été émis récemment, bloquer le renvoi
  if (
    expiresAt > Date.now() &&
    String(current?.accept_otp_sent_to || "").toLowerCase() === to
  ) {
    const remainingMs = expiresAt - Date.now();
    const ageFromExpiry = ACCEPT_OTP_TTL_MS - remainingMs;
    if (ageFromExpiry < ACCEPT_OTP_RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: "Un code vient d'être envoyé. Patientez quelques secondes.",
        code: "otp_cooldown",
      };
    }
  }

  const otp = newAcceptOtpCode();
  const patch = {
    accept_otp_hash: hashAcceptOtp(otp),
    accept_otp_expires_at: new Date(Date.now() + ACCEPT_OTP_TTL_MS).toISOString(),
    accept_otp_attempts: 0,
    accept_otp_sent_to: to,
    updated_at: new Date().toISOString(),
  };

  const { error: updErr } = await params.service
    .from("formation_documents")
    .update(patch)
    .eq("id", params.documentId);

  if (updErr) {
    if (/accept_otp_/i.test(updErr.message)) {
      return {
        ok: false,
        error: "Migration OTP non appliquée sur la base.",
        code: "otp_schema_missing",
      };
    }
    return { ok: false, error: updErr.message };
  }

  const kindLabel = params.kind === "convention" ? "convention" : "devis";
  const course = (params.courseTitle || "Formation").trim();
  const hello = (params.recipientName || "").trim() || "Bonjour";

  const html = buildEdgeEmailShell({
    title: `Code de signature — ${kindLabel}`,
    preheader: `Votre code : ${otp}`,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        ${escapeEdgeEmailHtml(hello)},
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Voici le code pour signer ${
          params.kind === "convention" ? "la convention" : "le devis"
        } « ${escapeEdgeEmailHtml(course)} » :
      </p>
      <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:8px;color:#111;">
        ${escapeEdgeEmailHtml(otp)}
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#8A8A8A;">
        Valable 10 minutes. Ne le partagez pas. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
      </p>`,
    footerNote: "Byound · signature document formation",
  });

  const result = await sendEmail({
    to,
    from: EDGE_COCKPIT_FROM,
    subject: `Code Byound ${otp} — signature ${kindLabel}`,
    html,
    tags: { type: "formation-doc-accept-otp", document_id: params.documentId },
  });

  if (!result.success) {
    return { ok: false, error: result.error || "Envoi du code impossible." };
  }

  return { ok: true, emailed_to: maskEmail(to) };
}

/** Vérifie le code sans le consommer (incrémente les tentatives si faux). */
export async function verifyAcceptOtp(params: {
  service: SupabaseClient;
  documentId: string;
  otpCode: string;
}): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  const code = String(params.otpCode || "").replace(/\D/g, "");
  if (code.length !== 6) {
    return { ok: false, error: "Saisissez le code à 6 chiffres reçu par e-mail.", code: "otp_format" };
  }

  const { data: doc, error } = await params.service
    .from("formation_documents")
    .select(
      "id, accept_otp_hash, accept_otp_expires_at, accept_otp_attempts, accept_otp_sent_to",
    )
    .eq("id", params.documentId)
    .maybeSingle();

  if (error && /accept_otp_/i.test(error.message)) {
    return {
      ok: false,
      error: "Migration OTP non appliquée sur la base.",
      code: "otp_schema_missing",
    };
  }
  if (!doc) return { ok: false, error: "Document introuvable" };

  if (!doc.accept_otp_hash || !doc.accept_otp_expires_at) {
    return {
      ok: false,
      error: "Demandez d'abord un code par e-mail.",
      code: "otp_missing",
    };
  }
  if (Date.parse(String(doc.accept_otp_expires_at)) < Date.now()) {
    return { ok: false, error: "Code expiré. Demandez un nouveau code.", code: "otp_expired" };
  }
  if (Number(doc.accept_otp_attempts ?? 0) >= ACCEPT_OTP_MAX_ATTEMPTS) {
    return {
      ok: false,
      error: "Trop de tentatives. Demandez un nouveau code.",
      code: "otp_locked",
    };
  }

  const ok = hashAcceptOtp(code) === String(doc.accept_otp_hash);
  if (!ok) {
    await params.service
      .from("formation_documents")
      .update({
        accept_otp_attempts: Number(doc.accept_otp_attempts ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.documentId);
    return { ok: false, error: "Code incorrect.", code: "otp_invalid" };
  }

  return { ok: true };
}

/** Invalide le code après signature réussie. */
export async function clearAcceptOtp(service: SupabaseClient, documentId: string) {
  await service
    .from("formation_documents")
    .update({
      accept_otp_hash: null,
      accept_otp_expires_at: null,
      accept_otp_attempts: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);
}
