import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { READY_TOKEN_BYTES } from "@/lib/ready/constants";

function encryptionKey(): Buffer {
  const raw = process.env.READY_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("READY_ENCRYPTION_KEY manquant");
  }
  // Accepte base64 (32 bytes) ou hex (64 chars) ou passphrase dérivée SHA-256
  if (/^[A-Za-z0-9+/=]+$/.test(raw) && raw.length >= 44) {
    const buf = Buffer.from(raw, "base64");
    if (buf.length === 32) return buf;
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return createHash("sha256").update(raw).digest();
}

export function newReadyToken(): string {
  return randomBytes(READY_TOKEN_BYTES).toString("base64url");
}

export function hashReadyToken(token: string): string {
  return createHash("sha256").update(String(token).trim()).digest("hex");
}

/** AES-256-GCM : iv(12) || tag(16) || ciphertext — retourné en Buffer. */
export function encryptJson(value: unknown): Buffer {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(value ?? {}), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptJson<T = Record<string, unknown>>(payload: Buffer | Uint8Array | null): T | null {
  if (!payload || payload.length < 29) return null;
  const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const key = encryptionKey();
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}

export function bufferFromDb(value: unknown): Buffer | null {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") {
    // PostgREST peut renvoyer bytea en hex \x...
    if (value.startsWith("\\x")) return Buffer.from(value.slice(2), "hex");
    return Buffer.from(value, "base64");
  }
  return null;
}
