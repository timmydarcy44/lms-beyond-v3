import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";

/** Durée d'un code salle (HOTP) — min. 5 minutes pour laisser le temps d'ouvrir /e + e-mail. */
export const ATTENDANCE_STEP_SECONDS = 5 * 60;
export const ATTENDANCE_CODE_DIGITS = 4;
/** Fenêtre acceptée : courante + précédente (= jusqu'à ~10 min). */
export const ATTENDANCE_WINDOW_TOLERANCE = 1;
/** Cookie session après code salle (OTP + Face ID). */
export const ATTENDANCE_SESSION_TTL_MS = 15 * 60 * 1000;
export const ATTENDANCE_OTP_TTL_MS = 10 * 60 * 1000;
export const ATTENDANCE_MAX_ROOM_ATTEMPTS_PER_MIN = 5;
export const ATTENDANCE_MAX_OTP_ATTEMPTS = 5;

export function attendanceMasterSecret(): string {
  const secret =
    process.env.ATTENDANCE_HMAC_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  if (!secret) {
    throw new Error("ATTENDANCE_HMAC_SECRET manquant");
  }
  return secret;
}

/** K_slot = HMAC(secret_maître, slotId + nonce) — hex. */
export function deriveSlotKey(slotId: string, nonce: string, master = attendanceMasterSecret()): Buffer {
  return createHmac("sha256", master).update(`${slotId}:${nonce}`).digest();
}

export function newSlotNonce(): string {
  return randomBytes(16).toString("base64url");
}

export function hotpCounter(nowMs = Date.now()): number {
  return Math.floor(nowMs / 1000 / ATTENDANCE_STEP_SECONDS);
}

/** HOTP tronqué sur 4 chiffres (0–9999, paddé). */
export function hotpCode(slotKey: Buffer, counter: number, digits = ATTENDANCE_CODE_DIGITS): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", slotKey).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const mod = 10 ** digits;
  return String(binary % mod).padStart(digits, "0");
}

export function currentRoomCode(slotKey: Buffer, nowMs = Date.now()): {
  code: string;
  counter: number;
  expiresInMs: number;
} {
  const counter = hotpCounter(nowMs);
  const stepMs = ATTENDANCE_STEP_SECONDS * 1000;
  const expiresInMs = stepMs - (nowMs % stepMs);
  return { code: hotpCode(slotKey, counter), counter, expiresInMs };
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function verifyRoomCode(
  slotKey: Buffer,
  code: string,
  nowMs = Date.now(),
): { ok: true; counter: number } | { ok: false; reason: "invalid" | "format" } {
  const normalized = String(code ?? "").replace(/\D/g, "");
  if (normalized.length !== ATTENDANCE_CODE_DIGITS) {
    return { ok: false, reason: "format" };
  }
  const counter = hotpCounter(nowMs);
  for (let i = 0; i <= ATTENDANCE_WINDOW_TOLERANCE; i++) {
    const candidate = hotpCode(slotKey, counter - i);
    if (safeEqual(candidate, normalized)) {
      return { ok: true, counter: counter - i };
    }
  }
  return { ok: false, reason: "invalid" };
}

export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function newOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function secondsUntilRefresh(nowMs = Date.now()): number {
  return Math.ceil((ATTENDANCE_STEP_SECONDS * 1000 - (nowMs % (ATTENDANCE_STEP_SECONDS * 1000))) / 1000);
}
