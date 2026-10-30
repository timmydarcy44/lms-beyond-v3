import { decodeProtectedHeader, importJWK, jwtVerify, SignJWT, type JWK } from "jose";

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
export function publicJwksKeys(keys: unknown): JWK[] {
  if (!Array.isArray(keys)) return [];
  const seen = new Set<string>();
  return keys.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { d: _private, ...rest } = item as JWK;
    const kid = typeof rest.kid === "string" ? rest.kid : "";
    if (!rest.kty || !kid || seen.has(kid)) return [];
    seen.add(kid);
    return [rest];
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
    const kid = kidOverride || (typeof jwk.kid === "string" ? jwk.kid : "");
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
  const match = keys.find((key) => key.kid === header.kid) ?? keys.find((key) => algorithmForJwk(key) === alg);
  if (!match || algorithmForJwk(match) !== alg) throw new Error("Clé publique introuvable");
  const key = await importJWK(match, alg);
  const { payload } = await jwtVerify(jwt, key);
  return payload as Record<string, unknown>;
}
