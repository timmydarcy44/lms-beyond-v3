import { NextRequest, NextResponse } from "next/server";
import { IMPERSONATION_COOKIE } from "./constants";
import { effectiveMode, isSensitivePath } from "./policy";
import { impersonationSecret, verifyImpersonationToken } from "./token";

function clearCookie(response: NextResponse) {
  response.cookies.set(IMPERSONATION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function impersonationBlock(request: NextRequest): Promise<NextResponse | null> {
  const raw = request.cookies.get(IMPERSONATION_COOKIE)?.value;
  if (!raw) return null;
  const token = await verifyImpersonationToken(raw, impersonationSecret());
  const pathname = request.nextUrl.pathname;
  if (!token) return null;

  const now = new Date().toISOString();
  const mode = effectiveMode(
    {
      mode: token.mode,
      expiresAt: new Date(token.exp).toISOString(),
      writeExpiresAt: token.writeExp ? new Date(token.writeExp).toISOString() : null,
      endedAt: null,
    },
    now,
  );

  if (mode === "expired") {
    if (pathname.startsWith("/api")) {
      return clearCookie(NextResponse.json({ error: "Session d'accompagnement expirée" }, { status: 403 }));
    }
    const url = request.nextUrl.clone();
    url.pathname = "/super/organisations";
    url.searchParams.set("accompagnement", "expire");
    return clearCookie(NextResponse.redirect(url));
  }

  if (isSensitivePath(pathname)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Masqué pour Byound" }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/impersonation/masque";
    return NextResponse.rewrite(url);
  }

  const method = request.method.toUpperCase();
  const writing = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
  const staffControl = pathname.startsWith("/api/super/");
  if (writing && mode !== "write" && !staffControl) {
    return NextResponse.json({ error: "Lecture seule" }, { status: 403 });
  }

  return null;
}
