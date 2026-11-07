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

export function resolveWebAuthnConfig(requestUrl?: string): {
  rpID: string;
  rpName: string;
  origin: string;
} {
  const envOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "";
  let origin = envOrigin.replace(/\/$/, "");
  if (!origin && requestUrl) {
    try {
      const u = new URL(requestUrl);
      origin = `${u.protocol}//${u.host}`;
    } catch {
      origin = "http://localhost:3001";
    }
  }
  if (!origin) origin = "http://localhost:3001";
  const host = new URL(origin).hostname;
  return {
    rpID: host === "localhost" ? "localhost" : host,
    rpName: "Byound",
    origin,
  };
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
  const { rpID, origin } = resolveWebAuthnConfig(params.requestUrl);
  return verifyRegistrationResponse({
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: origin,
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
  const { rpID, origin } = resolveWebAuthnConfig(params.requestUrl);
  const publicKey = Buffer.from(params.credential.publicKey, "base64url");
  return verifyAuthenticationResponse({
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: origin,
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
