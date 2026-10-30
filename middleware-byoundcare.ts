import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CARE_PUBLIC_ORIGIN,
  careAppToPublicPath,
  carePublicToAppPath,
  isByoundCareHostname,
  isCarePublicPath,
  requestHost,
} from "@/lib/care/host";
import { isByoundMarketingHost } from "@/lib/edge-site/byound-host";

function hasAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => /auth-token|sb-access|sb-refresh/i.test(cookie.name));
}

export function handleByoundCareHost(request: NextRequest) {
  if (!isByoundCareHostname(requestHost(request))) return null;

  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/super") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/privacy") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return null;
  }

  if (pathname === "/care" || pathname.startsWith("/care/")) {
    const clean = request.nextUrl.clone();
    clean.pathname = careAppToPublicPath(pathname);
    return NextResponse.redirect(clean, 308);
  }

  if (!isCarePublicPath(pathname)) return null;

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = carePublicToAppPath(pathname);
  const headers = new Headers(request.headers);
  headers.set("x-site-tenant", "byound-care");
  return NextResponse.rewrite(rewriteUrl, { request: { headers } });
}

/** Sur byound.fr, les fiches publiques Care pointent vers byoundcare.fr (sauf session : aperçu propriétaire). */
export function redirectByoundCareOffload(request: NextRequest) {
  if (!isByoundMarketingHost(requestHost(request))) return null;
  const pathname = request.nextUrl.pathname;
  if (pathname !== "/care" && !pathname.startsWith("/care/")) return null;
  if (hasAuthCookie(request)) return null;
  const dest = `${CARE_PUBLIC_ORIGIN}${careAppToPublicPath(pathname)}${request.nextUrl.search}`;
  return NextResponse.redirect(dest, 308);
}
