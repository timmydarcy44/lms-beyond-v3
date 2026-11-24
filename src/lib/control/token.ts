export type ImpersonationToken = {
  sid: string;
  orgId: string;
  staffId: string;
  orgName: string;
  mode: "read" | "write";
  exp: number;
  writeExp: number | null;
};

/** Preview BtoC : le staff voit l’espace d’un apprenant sans changer de compte Auth. */
export type LearnerPreviewToken = {
  sid: string;
  staffId: string;
  targetUserId: string;
  targetName: string;
  exp: number;
};

function bytesToB64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function b64UrlToBytes(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signImpersonationToken(token: ImpersonationToken, secret: string) {
  const payload = bytesToB64Url(new TextEncoder().encode(JSON.stringify(token)));
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `v1.${payload}.${bytesToB64Url(new Uint8Array(signature))}`;
}

export async function verifyImpersonationToken(value: string | undefined | null, secret: string): Promise<ImpersonationToken | null> {
  if (!value || !secret) return null;
  const [version, payload, signature] = value.split(".");
  if (version !== "v1" || !payload || !signature) return null;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    b64UrlToBytes(signature),
    new TextEncoder().encode(payload),
  );
  if (!valid) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(b64UrlToBytes(payload))) as ImpersonationToken;
    if (!parsed.sid || !parsed.orgId || !parsed.staffId || !parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function impersonationSecret() {
  return process.env.IMPERSONATION_COOKIE_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

export async function signLearnerPreviewToken(token: LearnerPreviewToken, secret: string) {
  const payload = bytesToB64Url(new TextEncoder().encode(JSON.stringify(token)));
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `lp1.${payload}.${bytesToB64Url(new Uint8Array(signature))}`;
}

export async function verifyLearnerPreviewToken(
  value: string | undefined | null,
  secret: string,
): Promise<LearnerPreviewToken | null> {
  if (!value || !secret) return null;
  const [version, payload, signature] = value.split(".");
  if (version !== "lp1" || !payload || !signature) return null;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    b64UrlToBytes(signature),
    new TextEncoder().encode(payload),
  );
  if (!valid) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(b64UrlToBytes(payload))) as LearnerPreviewToken;
    if (!parsed.sid || !parsed.staffId || !parsed.targetUserId || !parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}
