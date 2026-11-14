import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "dis:v1:";

function keyBytes(): Buffer | null {
  const raw = process.env.DISABILITY_SENSITIVE_KEY?.trim() || process.env.CFA_SENSITIVE_KEY?.trim();
  if (!raw) return null;
  return createHash("sha256").update(`byound-disability-notes:${raw}`).digest();
}

export function encryptDisabilityNotes(plain: string): string {
  const value = plain.trim();
  if (!value) return "";
  if (value.startsWith(PREFIX)) return value;
  const key = keyBytes();
  if (!key) return value; // fallback plaintext if no key (dev)
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptDisabilityNotes(stored: string | null | undefined): string {
  const value = String(stored ?? "");
  if (!value) return "";
  if (!value.startsWith(PREFIX)) return value;
  const key = keyBytes();
  if (!key) return "";
  try {
    const buf = Buffer.from(value.slice(PREFIX.length), "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}
