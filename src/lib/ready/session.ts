import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  READY_SESSION_COOKIE,
  READY_SESSION_MAX_MS,
} from "@/lib/ready/constants";

function sessionSecret(): string {
  const secret =
    process.env.READY_SESSION_SECRET?.trim() ||
    process.env.READY_ENCRYPTION_KEY?.trim();
  if (!secret) throw new Error("READY_SESSION_SECRET manquant");
  return secret;
}

type SessionPayload = {
  linkId: string;
  tokenHash: string;
  exp: number;
};

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createReadySessionValue(params: {
  linkId: string;
  tokenHash: string;
  linkExpiresAt: Date;
}): { value: string; maxAgeSec: number; expiresAt: Date } {
  const now = Date.now();
  const sessionCap = now + READY_SESSION_MAX_MS;
  const linkCap = params.linkExpiresAt.getTime();
  const expMs = Math.min(sessionCap, linkCap);
  const payload: SessionPayload = {
    linkId: params.linkId,
    tokenHash: params.tokenHash,
    exp: expMs,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = sign(body);
  return {
    value: `${body}.${sig}`,
    maxAgeSec: Math.max(1, Math.floor((expMs - now) / 1000)),
    expiresAt: new Date(expMs),
  };
}

export function parseReadySessionValue(
  value: string | undefined | null,
): SessionPayload | null {
  if (!value || !value.includes(".")) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!payload?.linkId || !payload?.tokenHash || !payload?.exp) return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setReadySessionCookie(params: {
  linkId: string;
  tokenHash: string;
  linkExpiresAt: Date;
}): Promise<void> {
  const session = createReadySessionValue(params);
  const jar = await cookies();
  jar.set(READY_SESSION_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Path=/ : le cookie doit aussi partir vers /api/ready/* (sinon fiche → 401).
    path: "/",
    maxAge: session.maxAgeSec,
  });
}

export async function clearReadySessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(READY_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readReadySession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return parseReadySessionValue(jar.get(READY_SESSION_COOKIE)?.value);
}

/** Cookie httpOnly (secours) + Authorization Bearer (principal côté SPA). */
export function readReadySessionFromRequest(request: Request): SessionPayload | null {
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    const fromBearer = parseReadySessionValue(token);
    if (fromBearer) return fromBearer;
  }
  const readyHeader = request.headers.get("x-ready-session")?.trim();
  if (readyHeader) {
    const fromHeader = parseReadySessionValue(readyHeader);
    if (fromHeader) return fromHeader;
  }
  const header = request.headers.get("cookie") || "";
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${READY_SESSION_COOKIE}=`));
  if (!match) return null;
  try {
    const value = decodeURIComponent(match.slice(READY_SESSION_COOKIE.length + 1));
    return parseReadySessionValue(value);
  } catch {
    return parseReadySessionValue(match.slice(READY_SESSION_COOKIE.length + 1));
  }
}

export function readySessionSetCookieHeader(params: {
  linkId: string;
  tokenHash: string;
  linkExpiresAt: Date;
}): string {
  const session = createReadySessionValue(params);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${READY_SESSION_COOKIE}=${encodeURIComponent(session.value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${session.maxAgeSec}${secure}`;
}

export function issueReadySession(params: {
  linkId: string;
  tokenHash: string;
  linkExpiresAt: Date;
}): { value: string; maxAgeSec: number; cookie: string } {
  const session = createReadySessionValue(params);
  return {
    value: session.value,
    maxAgeSec: session.maxAgeSec,
    cookie: readySessionSetCookieHeader(params),
  };
}

