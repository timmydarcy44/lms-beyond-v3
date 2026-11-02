import { cookies } from "next/headers";
import { IMPERSONATION_COOKIE } from "./constants";
import { effectiveMode } from "./policy";
import { impersonationSecret, verifyImpersonationToken, type ImpersonationToken } from "./token";

export type ImpersonationContext = ImpersonationToken & {
  mode: "read" | "write";
  expired: boolean;
};

export async function readImpersonationContext(): Promise<ImpersonationContext | null> {
  const jar = await cookies();
  const token = await verifyImpersonationToken(jar.get(IMPERSONATION_COOKIE)?.value, impersonationSecret());
  if (!token) return null;
  const mode = effectiveMode(
    {
      mode: token.mode,
      expiresAt: new Date(token.exp).toISOString(),
      writeExpiresAt: token.writeExp ? new Date(token.writeExp).toISOString() : null,
      endedAt: null,
    },
    new Date().toISOString(),
  );
  if (mode === "expired") return { ...token, mode: "read", expired: true };
  return { ...token, mode, expired: false };
}

export function impersonationCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
