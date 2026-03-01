import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getTenantFromHostname } from "@/lib/tenant/config";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const tenant = getTenantFromHostname(hostname);

  if (tenant) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-id", tenant.id);
    requestHeaders.set("x-tenant-domain", tenant.domain);
    requestHeaders.set("x-tenant-name", encodeURIComponent(tenant.name));
    requestHeaders.set("x-super-admin-email", tenant.superAdminEmail);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set("tenant-id", tenant.id, {
      path: "/",
      sameSite: "lax",
    });
    response.cookies.set("tenant-domain", tenant.domain, {
      path: "/",
      sameSite: "lax",
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
