import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

export function hasSensitiveKey() {
  return Boolean(process.env.CFA_SENSITIVE_KEY?.trim());
}

function keyBytes(): Buffer | null {
  const raw = process.env.CFA_SENSITIVE_KEY?.trim();
  if (!raw) return null;
  return createHash("sha256").update(`byound-cfa-sensitive:${raw}`).digest();
}

export const SENSITIVE_KEY_ERROR =
  "Ajoutez CFA_SENSITIVE_KEY pour enregistrer le numéro de sécurité sociale et la RQTH.";

export function isSealed(value: string) {
  return value.startsWith(PREFIX);
}

export function encryptSensitive(plain: string): string | null {
  const value = plain.trim();
  if (!value || isSealed(value)) return value;
  const key = keyBytes();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptSensitive(value: string): string {
  if (!value || !isSealed(value)) return value;
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

export function maskNss(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value ? "renseigné" : "";
  return `${digits.slice(0, 1)} ** ** ** *** *** ${digits.slice(-2)}`;
}

function openField(value: string) {
  return decryptSensitive(String(value ?? ""));
}

/** Chiffre le numéro de sécurité sociale et la RQTH avant écriture. Une valeur vide ou inchangée ne les remplace pas. */
export function mergeSealedCerfa(previous: Record<string, string>, incoming: Record<string, unknown>) {
  const next = { ...previous };
  const refused: string[] = [];
  const applySensitive = (key: "socialSecurityNumber" | "rqth", value: string) => {
    const previousPlain = openField(String(previous[key] ?? ""));
    if (!value || value.includes("**") || isSealed(value) || value === previousPlain) return;
    const sealed = encryptSensitive(value);
    if (!sealed) {
      refused.push(key);
      return;
    }
    next[key] = sealed;
  };
  for (const [key, raw] of Object.entries(incoming)) {
    if (key.startsWith("_") || key === "socialSecurityNumberMask" || key === "rqthPresent") continue;
    const value = String(raw ?? "").trim();
    if (key === "socialSecurityNumber" || key === "rqth") {
      applySensitive(key, value);
      continue;
    }
    next[key] = value;
  }
  if (hasSensitiveKey()) {
    for (const key of ["socialSecurityNumber", "rqth"] as const) {
      const current = String(next[key] ?? "");
      if (current && !isSealed(current)) {
        const sealed = encryptSensitive(current);
        if (sealed) next[key] = sealed;
      }
    }
  }
  return { cerfa: next, refused };
}

export function presentCerfa(cerfa: Record<string, string> | null | undefined, access: "staff" | "admin" | "owner") {
  const source = { ...(cerfa ?? {}) };
  const nss = openField(String(source.socialSecurityNumber ?? ""));
  const rqth = openField(String(source.rqth ?? ""));
  if (access === "owner") {
    return { ...source, socialSecurityNumber: nss, rqth };
  }
  return {
    ...source,
    socialSecurityNumber: "",
    socialSecurityNumberMask: nss ? maskNss(nss) : "",
    rqth: "",
    rqthPresent: rqth ? "1" : "",
  };
}

export function revealCerfaField(cerfa: Record<string, string> | null | undefined, field: "socialSecurityNumber" | "rqth") {
  return openField(String(cerfa?.[field] ?? ""));
}
