import { importJWK, jwtVerify, SignJWT, type JWK } from "jose";

export function publicJwkFromPrivate(jwk: JWK, kid: string): JWK {
  const { d: _private, ...rest } = jwk;
  return { ...rest, alg: "EdDSA", use: "sig", kid };
}

export async function signCredentialJwt(
  credential: Record<string, unknown>,
  key?: { jwk: JWK; kid: string },
): Promise<{ jwt: string; kid: string } | null> {
  const resolved = key ?? signingKeyFromEnv();
  if (!resolved) return null;
  const privateKey = await importJWK(resolved.jwk, "EdDSA");
  const jwt = await new SignJWT(credential)
    .setProtectedHeader({ alg: "EdDSA", kid: resolved.kid, typ: "vc+jwt" })
    .sign(privateKey);
  return { jwt, kid: resolved.kid };
}

export async function verifyCredentialJwt(jwt: string, publicKey: JWK): Promise<Record<string, unknown>> {
  const key = await importJWK(publicKey, "EdDSA");
  const { payload } = await jwtVerify(jwt, key);
  return payload as Record<string, unknown>;
}

function signingKeyFromEnv(): { jwk: JWK; kid: string } | null {
  const raw = process.env.BADGE_SIGNING_PRIVATE_JWK?.trim();
  const kid = process.env.BADGE_SIGNING_KID?.trim();
  if (!raw || !kid) return null;
  try {
    return { jwk: JSON.parse(raw) as JWK, kid };
  } catch {
    return null;
  }
}
