import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getTenantFromHostname } from "@/lib/tenant/config";

const BEYOND_ONLY_PREFIXES = [
  "/dashboard",
  "/lms",
  "/portail",
  "/espace",
  "/particuliers",
  "/beyond-connect",
  "/beyond-connect-app",
  "/beyond-center",
  "/beyond-center-app",
  "/beyond-no-school",
  "/beyond-note",
  "/beyond-note-app",
  "/beyond-care",
  "/beyond-play",
];

const JESSICA_ALIAS_PREFIXES = [
  "/consultations",
  "/a-propos",
  "/specialites",
  "/orientation",
  "/ressources",
  "/blog",
];

const JESSICA_ACCOUNT_PREFIXES = [
  "/inscription",
  "/login",
  "/mon-compte",
  "/panier",
  "/confirmer",
  "/forgot-password",
  "/reset-password",
];

const JESSICA_ROOT_PREFIXES = [...JESSICA_ALIAS_PREFIXES, ...JESSICA_ACCOUNT_PREFIXES];

const NEVO_ONLY_PREFIXES = [
  "/app-landing",
];

const startsWithAnyPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const hostWithoutPort = hostname.split(":")[0];

  const isJessica =
    hostWithoutPort === "jessicacontentin.fr" ||
    hostWithoutPort === "www.jessicacontentin.fr" ||
    hostWithoutPort === "app.jessicacontentin.fr";
  const isBeyond = hostname.includes("beyondcenter.fr");
  const isNevo =
    hostWithoutPort === "nevo-app.fr" ||
    hostWithoutPort === "www.nevo-app.fr";
  const tenant = getTenantFromHostname(hostname);

  if (isJessica && startsWithAnyPrefix(url.pathname, BEYOND_ONLY_PREFIXES)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isJessica && url.pathname === "/jessica-contentin") {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.pathname = "/";
    return NextResponse.redirect(cleanUrl);
  }

  if (isJessica && url.pathname.startsWith("/jessica-contentin/")) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.pathname = url.pathname.replace("/jessica-contentin", "") || "/";
    return NextResponse.redirect(cleanUrl);
  }

  if (isBeyond && url.pathname === "/") {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  if (isBeyond && (url.pathname.startsWith("/jessica-contentin") || startsWithAnyPrefix(url.pathname, JESSICA_ALIAS_PREFIXES))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isNevo && url.pathname === "/") {
    return NextResponse.redirect(new URL("/app-landing", request.url));
  }

  if (isNevo && startsWithAnyPrefix(url.pathname, BEYOND_ONLY_PREFIXES)) {
    return NextResponse.redirect(new URL("/app-landing", request.url));
  }

  if (!isNevo && startsWithAnyPrefix(url.pathname, NEVO_ONLY_PREFIXES)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isJessica && (url.pathname === "/lms" || url.pathname.startsWith("/lms/"))) {
    const legacySubPath = url.pathname === "/lms" ? "/apprenant" : url.pathname.replace(/^\/lms/, "");
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/portail${legacySubPath}`;
    return NextResponse.redirect(redirectUrl);
  }

  const requestHeaders = new Headers(request.headers);

  if (tenant) {
    requestHeaders.set("x-tenant-id", tenant.id);
    requestHeaders.set("x-tenant-domain", tenant.domain);
    requestHeaders.set("x-tenant-name", encodeURIComponent(tenant.name));
    requestHeaders.set("x-super-admin-email", tenant.superAdminEmail);
  }

  if (isJessica) {
    requestHeaders.set("x-site-tenant", "jessica");
  } else if (isBeyond) {
    requestHeaders.set("x-site-tenant", "beyond");
  } else if (isNevo) {
    requestHeaders.set("x-site-tenant", "nevo");
  }

  const shouldRewriteJessicaPath =
    isJessica &&
    (url.pathname === "/" || startsWithAnyPrefix(url.pathname, JESSICA_ROOT_PREFIXES));

  const response = shouldRewriteJessicaPath
    ? (() => {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = url.pathname === "/" ? "/jessica-contentin" : `/jessica-contentin${url.pathname}`;
        return NextResponse.rewrite(rewriteUrl, {
          request: {
            headers: requestHeaders,
          },
        });
      })()
    : NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

  if (tenant) {
    response.cookies.set("tenant-id", tenant.id, {
      path: "/",
      sameSite: "lax",
    });
    response.cookies.set("tenant-domain", tenant.domain, {
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};
