import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { ATTENDANCE_SESSION_TTL_MS, hashToken } from "@/lib/formation-attendance/token";

export const DEVICE_COOKIE = "byound_att_device";
export const EMARGE_SESSION_COOKIE = "byound_att_session";

export type EmargeSessionPayload = {
  launchId: string;
  slotId: string;
  profileId?: string;
  counter: number;
  exp: number;
  source: "qr" | "code_oral";
};

export async function readOrCreateDeviceToken(): Promise<{ token: string; created: boolean }> {
  const jar = await cookies();
  const existing = jar.get(DEVICE_COOKIE)?.value;
  if (existing && existing.length >= 16) {
    return { token: existing, created: false };
  }
  const token = randomBytes(24).toString("base64url");
  jar.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return { token, created: true };
}

export function deviceTokenHash(token: string): string {
  return hashToken(token);
}

export async function setEmargeSession(payload: EmargeSessionPayload): Promise<void> {
  const jar = await cookies();
  const raw = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  jar.set(EMARGE_SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.ceil(ATTENDANCE_SESSION_TTL_MS / 1000),
  });
}

export async function readEmargeSession(): Promise<EmargeSessionPayload | null> {
  const jar = await cookies();
  const raw = jar.get(EMARGE_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const json = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as EmargeSessionPayload;
    if (!json.exp || json.exp < Date.now()) return null;
    return json;
  } catch {
    return null;
  }
}

export async function clearEmargeSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(EMARGE_SESSION_COOKIE);
}

export function buildEmargeSession(params: {
  launchId: string;
  slotId: string;
  counter: number;
  source: "qr" | "code_oral";
  profileId?: string;
}): EmargeSessionPayload {
  return {
    ...params,
    exp: Date.now() + ATTENDANCE_SESSION_TTL_MS,
  };
}
