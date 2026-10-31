import { decodeProtectedHeader, importJWK, jwtVerify, SignJWT, type JWK } from "jose";
import { BADGE_PUBLIC_ORIGIN } from "@/lib/openbadges/v3/credential";

export const BADGE_KEY_ID = "byound-es256-2026";
export const BADGE_KEY_URL = `${BADGE_PUBLIC_ORIGIN}/.well-known/keys/${BADGE_KEY_ID}.json`;

/** L'identifiant court et l'URL publique désignent la même clé. */
export function canonicalSigningKid(kid: string): string {
  const trimmed = kid.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const short = trimmed.split("/").pop()?.replace(/\.json$/i, "") || trimmed;
  return `${BADGE_PUBLIC_ORIGIN}/.well-known/keys/${short}.json`;
}

export function signingKidAliases(kid: string): string[] {
  const aliases = new Set<string>([kid.trim()]);
  const canonical = canonicalSigningKid(kid);
  aliases.add(canonical);
  const file = canonical.split("/").pop() ?? "";
  aliases.add(file);
  aliases.add(file.replace(/\.json$/i, ""));
  return [...aliases];
}

export function kidsMatch(headerKid: string | undefined, storedKid: string): boolean {
  if (!headerKid) return false;
  const header = new Set(signingKidAliases(headerKid));
  return signingKidAliases(storedKid).some((alias) => header.has(alias));
}

export type BadgeSigningAlg = "ES256" | "EdDSA";

export function algorithmForJwk(jwk: JWK): BadgeSigningAlg {
  if (jwk.alg === "ES256" || jwk.alg === "EdDSA") return jwk.alg;
  if (jwk.kty === "EC") return "ES256";
  if (jwk.kty === "OKP") return "EdDSA";
  throw new Error("Algorithme de signature de badge non pris en charge");
}

export function publicJwkFromPrivate(jwk: JWK, kid: string): JWK {
  const { d: _private, ...rest } = jwk;
  return { ...rest, alg: algorithmForJwk(jwk), use: "sig", kid };
}

/** Retire toute clé privée avant publication. */
export function publishedJwk(jwk: JWK): JWK | null {
  const kid = typeof jwk.kid === "string" ? canonicalSigningKid(jwk.kid) : "";
  if (jwk.kty !== "EC" || !jwk.crv || !jwk.x || !jwk.y || !kid) return null;
  return { kty: "EC", crv: jwk.crv, x: jwk.x, y: jwk.y, alg: "ES256", use: "sig", kid };
}

export function findPublicJwk(keys: JWK[], requested: string): JWK | null {
  const needle = decodeURIComponent(requested);
  return keys.find((key) => typeof key.kid === "string" && kidsMatch(needle, key.kid)) ?? null;
}

export function publicJwksKeys(keys: unknown): JWK[] {
  if (!Array.isArray(keys)) return [];
  const seen = new Set<string>();
  return keys.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { d: _private, ...rest } = item as JWK;
    const rawKid = typeof rest.kid === "string" ? rest.kid : "";
    const kid = rawKid ? canonicalSigningKid(rawKid) : "";
    if (!rest.kty || !kid || seen.has(kid)) return [];
    if (rest.kty === "EC") {
      const published = publishedJwk({ ...rest, kid: rawKid });
      if (!published) return [];
      seen.add(published.kid as string);
      return [published];
    }
    if (rest.kty === "OKP" && rest.crv && rest.x) {
      seen.add(kid);
      return [{ kty: "OKP", crv: rest.crv, x: rest.x, alg: "EdDSA", use: "sig", kid }];
    }
    return [];
  });
}

export function signingKeyFromEnv(): { jwk: JWK; kid: string } | null {
  return keyFromEnv("BADGE_SIGNING_PRIVATE_JWK", process.env.BADGE_SIGNING_KID?.trim());
}

export function legacySigningKeyFromEnv(): { jwk: JWK; kid: string } | null {
  return keyFromEnv("BADGE_SIGNING_LEGACY_PRIVATE_JWK");
}

function keyFromEnv(name: string, kidOverride?: string): { jwk: JWK; kid: string } | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  try {
    const jwk = JSON.parse(raw) as JWK;
    const kid = canonicalSigningKid(kidOverride || (typeof jwk.kid === "string" ? jwk.kid : ""));
    if (!kid) return null;
    return { jwk, kid };
  } catch {
    return null;
  }
}

/** Clé active en premier, ancienne clé publique ensuite si elle est encore configurée. */
export function issuerPublicKeys(active?: { jwk: JWK; kid: string } | null): JWK[] {
  const current = active === undefined ? signingKeyFromEnv() : active;
  const keys: JWK[] = [];
  if (current) keys.push(publicJwkFromPrivate(current.jwk, current.kid));
  const legacy = legacySigningKeyFromEnv();
  if (legacy && legacy.kid !== current?.kid) keys.push(publicJwkFromPrivate(legacy.jwk, legacy.kid));
  return publicJwksKeys(keys);
}

export async function signCredentialJwt(
  credential: Record<string, unknown>,
  key?: { jwk: JWK; kid: string },
): Promise<{ jwt: string; kid: string } | null> {
  const resolved = key ?? signingKeyFromEnv();
  if (!resolved) return null;
  const alg = algorithmForJwk(resolved.jwk);
  const privateKey = await importJWK(resolved.jwk, alg);
  const jwt = await new SignJWT(credential)
    .setProtectedHeader({ alg, kid: resolved.kid, typ: "vc+jwt" })
    .sign(privateKey);
  return { jwt, kid: resolved.kid };
}

export async function verifyCredentialJwt(jwt: string, publicKeys: JWK | JWK[]): Promise<Record<string, unknown>> {
  const keys = publicJwksKeys(Array.isArray(publicKeys) ? publicKeys : [publicKeys]);
  const header = decodeProtectedHeader(jwt);
  const alg = header.alg === "ES256" || header.alg === "EdDSA" ? header.alg : null;
  if (!alg) throw new Error("Algorithme de credential non pris en charge");
  const match = keys.find((key) => typeof key.kid === "string" && kidsMatch(header.kid, key.kid));
  if (!match || algorithmForJwk(match) !== alg) throw new Error("Clé publique introuvable");
  const key = await importJWK(match, alg);
  const { payload } = await jwtVerify(jwt, key);
  return payload as Record<string, unknown>;
}
