import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTenantFromHostname } from '@/lib/tenant/config';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const tenant = getTenantFromHostname(hostname);

  console.log('[Middleware] Hostname:', hostname, 'Tenant:', tenant?.id);

  if (tenant) {
    // Ajouter le tenant dans les headers pour les routes API et pages
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', tenant.id);
    requestHeaders.set('x-tenant-domain', tenant.domain);
    requestHeaders.set('x-tenant-name', tenant.name);
    requestHeaders.set('x-super-admin-email', tenant.superAdminEmail);

    // Ajouter aussi dans les cookies pour le client-side
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set('tenant-id', tenant.id, {
      path: '/',
      sameSite: 'lax',
    });
    response.cookies.set('tenant-domain', tenant.domain, {
      path: '/',
      sameSite: 'lax',
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

