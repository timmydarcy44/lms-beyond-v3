import { createHmac, timingSafeEqual } from "crypto";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";

export type BackstageResourceKind =
  | "emarger"
  | "participants"
  | "programme"
  | "livret"
  | "support";

type Payload = {
  k: BackstageResourceKind;
  slot?: string;
  dossier?: string;
  doc?: string;
  exp: number;
};

function secret(): string {
  return (
    process.env.BACKSTAGE_URL_SECRET?.trim() ||
    process.env.ATTENDANCE_HMAC_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "byound-backstage-dev"
  );
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(body: string): string {
  return b64url(createHmac("sha256", secret()).update(body).digest());
}

export function expireAfterSessionMs(sessionEndMs: number, marginDays = 7): number {
  return sessionEndMs + marginDays * 24 * 60 * 60 * 1000;
}

export function createBackstageSignedUrl(params: {
  kind: BackstageResourceKind;
  slotId?: string | null;
  dossierId?: string | null;
  documentToken?: string | null;
  expiresAtMs: number;
}): string {
  const payload: Payload = {
    k: params.kind,
    exp: Math.floor(params.expiresAtMs / 1000),
  };
  if (params.slotId) payload.slot = params.slotId;
  if (params.dossierId) payload.dossier = params.dossierId;
  if (params.documentToken) payload.doc = params.documentToken;

  const body = b64url(JSON.stringify(payload));
  const sig = sign(body);

  if (params.kind === "emarger" && params.slotId) {
    const q = new URLSearchParams({
      slot: params.slotId,
      bt: body,
      sig,
    });
    return `${BYOUND_PUBLIC_ORIGIN}/e?${q.toString()}`;
  }

  if (params.kind === "programme" || params.kind === "livret" || params.kind === "support") {
    if (params.documentToken) {
      const q = new URLSearchParams({
        token: params.documentToken,
        bt: body,
        sig,
      });
      return `${BYOUND_PUBLIC_ORIGIN}/doc?${q.toString()}`;
    }
  }

  const q = new URLSearchParams({ bt: body, sig });
  return `${BYOUND_PUBLIC_ORIGIN}/backstage?${q.toString()}`;
}

export function verifyBackstageToken(
  body: string,
  sig: string,
): { ok: true; payload: Payload } | { ok: false; error: string } {
  if (!body || !sig) return { ok: false, error: "missing" };
  const expected = sign(body);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "bad_sig" };
    }
  } catch {
    return { ok: false, error: "bad_sig" };
  }
  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as Payload;
    if (!payload?.k || !payload.exp) return { ok: false, error: "bad_payload" };
    if (payload.exp * 1000 < Date.now()) return { ok: false, error: "expired" };
    return { ok: true, payload };
  } catch {
    return { ok: false, error: "bad_payload" };
  }
}

export function qrImageUrl(targetUrl: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
}
