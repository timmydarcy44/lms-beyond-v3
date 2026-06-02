import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getTenantFromHostname, isJessicaContentinMarketingHostname } from "@/lib/tenant/config";
import { isUniversalAdminRole } from "@/lib/auth/is-admin-role";
import { resolveDestinationFromProfile } from "@/lib/auth/post-login-redirect";
import {
  isEcoleHandicapSectionPath,
  shouldRestrictSchoolDashboardToHandicapOnly,
} from "@/lib/auth/school-role-type-guards";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Profil minimal pour redirection post-login (cookies requête). */
async function fetchProfileForRequest(
  request: NextRequest,
): Promise<{ role: string | null; role_type: string | null } | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const cookieAdapter = NextResponse.next();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        cookieAdapter.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieAdapter.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role_type")
    .eq("id", user.id)
    .maybeSingle();
  return (profile as { role?: string | null; role_type?: string | null } | null) ?? null;
}

async function fetchProfileRoleForRequest(request: NextRequest): Promise<string> {
  const profile = await fetchProfileForRequest(request);
  return String(profile?.role ?? "")
    .trim()
    .toLowerCase();
}

const BEYOND_ONLY_PREFIXES = [
  "/super",
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
  /** Marketing / produits Beyond — interdits sur le domaine vitrine Jessica */
  "/landing",
  "/app-landing",
  "/for-business",
  "/for-education",
  "/for-club",
  "/demo",
  "/tarif",
  "/plateforme",
  "/pilotage",
  "/beyond-fc",
  "/pages",
];

const JESSICA_ALIAS_PREFIXES = [
  "/consultations",
  "/a-propos",
  "/specialites",
  "/programmes",
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

const startsWithAnyPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/** Site marketing Beyond Center — ne doit pas être traité comme l’ancien domaine « Beyond » (/landing). */
function isBeyondCenterHostname(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "beyondcenter.fr" || h === "www.beyondcenter.fr";
}

function isEdgeBsHostname(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "edgebs.fr" || h === "www.edgebs.fr";
}

function isEdgeOnlineHostname(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "edgeonline.fr" || h === "www.edgeonline.fr";
}

/** True si le Host de la requête correspond au domaine de NEXT_PUBLIC_SITE_URL (évite d’appliquer Nevo / Jessica à tous les domaines du même projet Vercel). */
function requestMatchesConfiguredSiteHost(requestHost: string, siteUrl: string): boolean {
  if (!siteUrl) return false;
  try {
    const configured = new URL(siteUrl).hostname.toLowerCase();
    const req = requestHost.split(":")[0]?.toLowerCase() ?? "";
    return configured !== "" && req === configured;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/super")) return NextResponse.next();
  const url = request.nextUrl;
  const originalUrl = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";
  const hostWithoutPort = hostname.split(":")[0];
  const beyondCenterHost = isBeyondCenterHostname(hostWithoutPort);
  const edgeBsHost = isEdgeBsHostname(hostWithoutPort);
  const edgeOnlineHost = isEdgeOnlineHostname(hostWithoutPort);
  const tenant = getTenantFromHostname(hostname);

  if (edgeBsHost) {
    const edgeBsPublicPrefixes = [
      "/parcours",
      "/edge-online",
      "/online",
      "/entreprises",
      "/orientation",
      "/votre-orientation",
      "/postuler",
    ] as const;
    const isEdgeBsMarketingPath =
      url.pathname === "/" ||
      edgeBsPublicPrefixes.some(
        (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
      );
    if (isEdgeBsMarketingPath) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = url.pathname === "/" ? "/edge-lab" : `/edge-lab${url.pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }

    // Catalogue EDGE Online sur edgebs.fr : URLs courtes /formations → surface /edgeonline
    const isEdgeBsOnlineCatalogPath =
      url.pathname === "/edgeonline" ||
      url.pathname.startsWith("/edgeonline/") ||
      url.pathname === "/formations" ||
      url.pathname.startsWith("/formations/");
    if (isEdgeBsOnlineCatalogPath) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-url-pathname", url.pathname);
      requestHeaders.set("x-org-slug", "edgelab");
      requestHeaders.set("x-site-tenant", "edgeonline");

      const rewriteUrl = request.nextUrl.clone();
      if (url.pathname === "/edgeonline") {
        rewriteUrl.pathname = "/edgeonline";
      } else if (url.pathname.startsWith("/edgeonline/")) {
        rewriteUrl.pathname = url.pathname;
      } else {
        rewriteUrl.pathname = `/edgeonline${url.pathname}`.replace(/\/{2,}/g, "/");
      }
      return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
    }
  }

  // --- EDGE Online (premium product surface) ---
  // On edgeonline.fr, expose a clean product URL space (/, /parcours, /formations, etc.)
  // while keeping internal multi-tenant galaxy routes untouched.
  if (edgeOnlineHost) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-url-pathname", url.pathname);
    requestHeaders.set("x-org-slug", "edgelab");
    requestHeaders.set("x-site-tenant", "edgeonline");

    const rewriteUrl = request.nextUrl.clone();
    // Map clean URLs to the dedicated app surface under /edgeonline
    if (url.pathname === "/") {
      rewriteUrl.pathname = "/edgeonline";
    } else if (!url.pathname.startsWith("/edgeonline")) {
      rewriteUrl.pathname = `/edgeonline${url.pathname}`.replace(/\/{2,}/g, "/");
    }
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  // --- Galaxies (multi-tenant org slug in path) ---
  // URL format: /g/:orgSlug/<app-path>
  // Example: /g/acme/catalog/formations/slug  → sets x-org-slug=acme and rewrites path to /catalog/formations/slug
  const pathParts = url.pathname.split("/").filter(Boolean);
  const orgSlugFromPath =
    pathParts[0] === "g" && typeof pathParts[1] === "string" && pathParts[1].trim() !== ""
      ? pathParts[1].trim()
      : null;
  const rest = orgSlugFromPath ? pathParts.slice(2) : [];
  const rewrittenPath = orgSlugFromPath ? `/${rest.join("/")}`.replace(/\/{2,}/g, "/") || "/" : null;

  if (
    url.pathname === "/api/nevo/stripe/webhook" ||
    url.pathname.startsWith("/api/nevo/stripe") ||
    url.pathname.startsWith("/api/stripe")
  ) {
    return NextResponse.next();
  }

  const hasAuthToken =
    url.searchParams.has("access_token") ||
    url.searchParams.has("refresh_token") ||
    url.searchParams.has("code");

  if (url.pathname.startsWith("/note-app") && hasAuthToken) {
    return NextResponse.next();
  }

  if (url.pathname.includes("complete-profile")) {
    return NextResponse.next();
  }

  const currentUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  let siteHost = "";
  try {
    if (currentUrl) siteHost = new URL(currentUrl).hostname;
  } catch {
    siteHost = "";
  }
  const isNevoEnv = currentUrl.includes("nevo");
  /** Règles Nevo (home /app-landing, etc.) uniquement sur le domaine configuré — pas sur beyondcenter.fr ni autres domaines du même déploiement. */
  const isNevo =
    isNevoEnv &&
    !beyondCenterHost &&
    requestMatchesConfiguredSiteHost(hostWithoutPort, currentUrl);
  /** Jessica (marketing + app) : basé sur la résolution tenant, pas sur une sous-chaîne du Host (évite les faux négatifs). */
  const isJessica = tenant?.id === "jessica-contentin" || tenant?.id === "jessica-contentin-app";
  /**
   * Hôte public du site marketing Jessica (pas app., pas localhost).
   * Si NEXT_PUBLIC_SITE_URL pointe vers Jessica mais que vous testez sur localhost,
   * `isJessica` est vrai via l’env — sans ce garde-fou, on redirige /jessica-contentin/…
   * vers des URLs courtes et la résolution peut finir en 404 en dev.
   */
  const isJessicaPublicHost = isJessicaContentinMarketingHostname(hostWithoutPort);
  /**
   * Règles « ancien domaine Beyond » (/ → /landing, etc.) : basées sur le **host de la requête**
   * quand NEXT_PUBLIC_SITE_URL est défini, sinon on retombe sur le host (localhost / anciens noms).
   * Sinon une URL Vercel du type *beyond*.vercel.app dans l’env activait Beyond sur **tous** les domaines (ex. jessicacontentin.fr).
   */
  const requestHostLower = hostWithoutPort.toLowerCase();
  const isBeyond =
    !beyondCenterHost &&
    !isJessica &&
    (siteHost
      ? siteHost.toLowerCase().includes("beyond") && requestMatchesConfiguredSiteHost(hostWithoutPort, currentUrl)
      : requestHostLower.includes("beyond"));
  const isAuthenticated = Boolean(
    request.cookies.get("sb-access-token")?.value || request.cookies.get("sb-refresh-token")?.value,
  );

  if (isNevo && url.pathname === "/") {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/app-landing";
    return NextResponse.rewrite(rewriteUrl);
  }

  if (isJessica && startsWithAnyPrefix(url.pathname, BEYOND_ONLY_PREFIXES)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isJessica && isJessicaPublicHost && url.pathname === "/jessica-contentin") {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.pathname = "/";
    return NextResponse.redirect(cleanUrl);
  }

  /** Pages Next sous `/jessica-contentin/...` (ex. programmes) : ne pas réécrire en URL courte — la route réelle vit ici. */
  const isJessicaContentinAppPath =
    url.pathname === "/jessica-contentin/programmes" ||
    url.pathname.startsWith("/jessica-contentin/programmes/");

  if (isJessica && isJessicaPublicHost && url.pathname.startsWith("/jessica-contentin/") && !isJessicaContentinAppPath) {
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

  if (isNevo && isAuthenticated && startsWithAnyPrefix(url.pathname, BEYOND_ONLY_PREFIXES)) {
    const role = await fetchProfileRoleForRequest(request);
    if (!isUniversalAdminRole(role)) {
      return NextResponse.redirect(new URL("/note-app", request.url));
    }
  }

  if (!isJessica && (url.pathname === "/lms" || url.pathname.startsWith("/lms/"))) {
    const legacySubPath = url.pathname === "/lms" ? "/apprenant" : url.pathname.replace(/^\/lms/, "");
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/portail${legacySubPath}`;
    return NextResponse.redirect(redirectUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url-pathname", url.pathname);

  if (orgSlugFromPath) {
    requestHeaders.set("x-org-slug", orgSlugFromPath);
  }

  if (tenant) {
    requestHeaders.set("x-tenant-id", tenant.id);
    requestHeaders.set("x-tenant-domain", tenant.domain);
    requestHeaders.set("x-tenant-name", encodeURIComponent(tenant.name));
    requestHeaders.set("x-super-admin-email", tenant.superAdminEmail);
  }

  if (isJessica) {
    requestHeaders.set("x-site-tenant", "jessica");
  } else if (beyondCenterHost) {
    requestHeaders.set("x-site-tenant", "beyond-center");
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
    : (() => {
        // Galaxies: don't rewrite paths here. We serve /g/:orgSlug/... with App Router routes directly.
        // We only propagate org slug via headers/cookies for downstream pages.
        if (orgSlugFromPath) {
          console.log(`Galaxie détectée: ${originalUrl.href} (org=${orgSlugFromPath}, rest=${rewrittenPath ?? "/"})`);
        }
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      })();

  // --- Redirection /dashboard selon profiles.role ---
  if (url.pathname === "/dashboard" && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const profile = await fetchProfileForRequest(request);
    const destination = resolveDestinationFromProfile(profile);
    if (destination) {
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  // --- RBAC Beyond Connect (profiles.role) ---
  // Only for dashboard scopes; never uses auth.users for role.
  // Admins / super_admins are not restricted here; layouts (apprenant/student) grant universal access for those roles.
  const isDashboardEntreprise = url.pathname === "/dashboard/entreprise" || url.pathname.startsWith("/dashboard/entreprise/");
  const isDashboardPraticien =
    url.pathname === "/dashboard/praticien" || url.pathname.startsWith("/dashboard/praticien/");
  const isDashboardExpert = url.pathname === "/dashboard/expert" || url.pathname.startsWith("/dashboard/expert/");
  const isDashboardProfil = url.pathname === "/dashboard/profil" || url.pathname.startsWith("/dashboard/profil/");

  if (
    (isDashboardEntreprise || isDashboardExpert || isDashboardProfil || isDashboardPraticien) &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY
  ) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, role_type, company_id")
      .eq("id", user.id)
      .maybeSingle();

    const profileRow = profile as {
      role?: string | null;
      role_type?: string | null;
      company_id?: string | null;
    } | null;
    const role = String(profileRow?.role ?? "").trim().toLowerCase();
    const roleType = String(profileRow?.role_type ?? "").trim().toLowerCase();
    const companyId = profileRow?.company_id ?? null;

    const isSuperAdmin =
      isUniversalAdminRole(role) || roleType === "super_admin" || role === "super_admin";
    if (isSuperAdmin) {
      return response;
    }

    if (isDashboardEntreprise) {
      if (role === "expert") {
        return NextResponse.redirect(new URL("/dashboard/expert", request.url));
      }
      const canAccessEntreprise = role === "admin_hr" || role === "entreprise" || role === "client";
      if (!canAccessEntreprise) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
      if (!companyId) {
        return NextResponse.redirect(new URL("/dashboard/entreprise/entreprise", request.url));
      }
    }

    if (isDashboardExpert) {
      if (role !== "expert") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    if (isDashboardPraticien) {
      const canAccessPraticien =
        isUniversalAdminRole(role) ||
        role === "praticien_bct" ||
        role === "praticien" ||
        roleType === "praticien_bct" ||
        roleType === "praticien";
      if (!canAccessPraticien) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    // Compte entreprise sans `company_id` : compléter la fiche société (plus de /dashboard/profil).
  }

  // --- École : `role_type` « référent handicap » → accès limité au module Handicap (commercialisation partielle) ---
  const isDashboardEcolePath =
    url.pathname === "/dashboard/ecole" || url.pathname.startsWith("/dashboard/ecole/");
  const isEcoleHandicapPath = isEcoleHandicapSectionPath(url.pathname);

  if (isDashboardEcolePath && !isEcoleHandicapPath && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabaseEcole = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    });
    const {
      data: { user: userEcole },
    } = await supabaseEcole.auth.getUser();
    if (userEcole) {
      const { data: profileEcole } = await supabaseEcole
        .from("profiles")
        .select("role, role_type")
        .eq("id", userEcole.id)
        .maybeSingle();
      const pe = profileEcole as { role?: string | null; role_type?: string | null } | null;
      const roleEcole = String(pe?.role ?? "").trim().toLowerCase();
      if (!isUniversalAdminRole(roleEcole)) {
        if (
          shouldRestrictSchoolDashboardToHandicapOnly({
            profileRole: pe?.role,
            profileRoleType: pe?.role_type,
          })
        ) {
          return NextResponse.redirect(new URL("/dashboard/ecole/handicap", request.url));
        }
      }
    }
  }

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

  if (orgSlugFromPath) {
    response.cookies.set("org-slug", orgSlugFromPath, {
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
