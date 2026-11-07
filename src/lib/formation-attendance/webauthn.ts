import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
  type VerifiedAuthenticationResponse,
  type VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/browser";

/**
 * Prefer the live page host (byound.fr / localhost / …) over NEXT_PUBLIC_SITE_URL.
 * SITE_URL may point to another brand domain (ex. edgebs) on the same Vercel project,
 * which breaks WebAuthn RP ID checks in the browser.
 */
export function resolveWebAuthnConfig(requestUrl?: string): {
  rpID: string;
  rpName: string;
  origin: string;
  origins: string[];
} {
  let origin = "";
  if (requestUrl) {
    try {
      const u = new URL(requestUrl);
      if (u.host) origin = `${u.protocol}//${u.host}`.replace(/\/$/, "");
    } catch {
      /* ignore */
    }
  }
  if (!origin) {
    origin = (
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "http://localhost:3001"
    ).replace(/\/$/, "");
  }
  const host = new URL(origin).hostname;
  // www.byound.fr → rpID byound.fr so Face ID works on apex + www
  const rpID =
    host === "localhost" || host === "127.0.0.1"
      ? "localhost"
      : host.replace(/^www\./, "");
  return {
    rpID,
    rpName: "Byound",
    origin,
    origins: relatedOrigins(origin),
  };
}

/** www + apex variants of an origin (same protocol). */
export function relatedOrigins(origin: string): string[] {
  try {
    const u = new URL(origin);
    const hosts = new Set<string>([u.host]);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      return [`${u.protocol}//${u.host}`];
    }
    if (u.hostname.startsWith("www.")) {
      hosts.add(u.host.replace(/^www\./, ""));
    } else {
      hosts.add(`www.${u.host}`);
    }
    return Array.from(hosts).map((h) => `${u.protocol}//${h}`);
  } catch {
    return [origin];
  }
}

/** Build absolute origin from a Next request (page Referer > proxy host). */
export function originFromRequest(req: {
  url: string;
  headers: { get(name: string): string | null };
  nextUrl?: { origin: string };
}): string {
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const u = new URL(referer);
      if (u.protocol === "http:" || u.protocol === "https:") {
        return `${u.protocol}//${u.host}`;
      }
    } catch {
      /* ignore */
    }
  }
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]!.trim();
    // Ignore raw vercel.app deployment host when a public referer was missing —
    // still better than edgebs SITE_URL if the request actually hit a custom domain.
    return `${proto}://${host}`;
  }
  if (req.nextUrl?.origin) return req.nextUrl.origin;
  try {
    return new URL(req.url).origin;
  } catch {
    return "http://localhost:3001";
  }
}

export type StoredCredential = {
  id: string;
  credentialId: string;
  publicKey: string;
  signCount: number;
  transports?: string[] | null;
  backedUp?: boolean;
};

export async function buildRegistrationOptions(params: {
  profileId: string;
  userName: string;
  userDisplayName: string;
  existingCredentialIds: string[];
  requestUrl?: string;
}) {
  const { rpID, rpName } = resolveWebAuthnConfig(params.requestUrl);
  return generateRegistrationOptions({
    rpName,
    rpID,
    userName: params.userName,
    userDisplayName: params.userDisplayName,
    userID: new TextEncoder().encode(params.profileId),
    attestationType: "none",
    excludeCredentials: params.existingCredentialIds.map((id) => ({
      id,
      transports: ["internal"] as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  });
}

export async function buildAuthenticationOptions(params: {
  allowCredentialIds: string[];
  requestUrl?: string;
}) {
  const { rpID } = resolveWebAuthnConfig(params.requestUrl);
  return generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: params.allowCredentialIds.map((id) => ({
      id,
      transports: ["internal"] as AuthenticatorTransportFuture[],
    })),
  });
}

export async function verifyRegistration(params: {
  response: RegistrationResponseJSON;
  expectedChallenge: string;
  requestUrl?: string;
}): Promise<VerifiedRegistrationResponse> {
  const { rpID, origins } = resolveWebAuthnConfig(params.requestUrl);
  return verifyRegistrationResponse({
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: origins,
    expectedRPID: rpID,
    requireUserVerification: true,
  });
}

export async function verifyAuthentication(params: {
  response: AuthenticationResponseJSON;
  expectedChallenge: string;
  credential: StoredCredential;
  requestUrl?: string;
}): Promise<VerifiedAuthenticationResponse> {
  const { rpID, origins } = resolveWebAuthnConfig(params.requestUrl);
  const publicKey = Buffer.from(params.credential.publicKey, "base64url");
  return verifyAuthenticationResponse({
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: origins,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: params.credential.credentialId,
      publicKey,
      counter: params.credential.signCount,
      transports: (params.credential.transports ?? undefined) as
        | AuthenticatorTransportFuture[]
        | undefined,
    },
  });
}

export function passkeyButtonLabel(userAgent: string | null): string {
  const ua = (userAgent ?? "").toLowerCase();
  if (/iphone|ipad|macintosh/.test(ua)) return "Signer avec Face ID";
  if (/android/.test(ua)) return "Signer avec votre empreinte";
  return "Signer avec le code de votre téléphone";
}

export function uint8ToBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}
