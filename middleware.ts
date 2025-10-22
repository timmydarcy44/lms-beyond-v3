import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Laisse passer /login, /api, assets…
  if (path.startsWith('/login') || path.startsWith('/api') || path.startsWith('/_next') || path.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Laisse passer les routes dashboard root (ils décideront en Server Component)
  if (path === '/admin' || path === '/formateur' || path === '/tuteur' || path === '/apprenant') {
    return NextResponse.next();
  }

  // Laisse passer les routes select-org
  if (path === '/admin/select-org' || path === '/formateur/select-org' || path === '/tuteur/select-org' || path === '/apprenant/select-org') {
    return NextResponse.next();
  }

  // Laisse passer les routes [org] (contrôle fin côté Server Component)
  if (path.match(/^\/(admin|formateur|tuteur|apprenant)\/[^\/]+/)) {
    return NextResponse.next();
  }

  // Pour toutes les autres routes, laisse passer
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/formateur/:path*',
    '/tuteur/:path*',
    '/apprenant/:path*'
  ]
};