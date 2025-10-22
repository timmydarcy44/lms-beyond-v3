import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // Toujours OK : login, api, assets, Next internals
  if (
    p.startsWith('/login') ||
    p.startsWith('/api') ||
    p.startsWith('/_next') ||
    p.startsWith('/favicon') ||
    p.startsWith('/public')
  ) return NextResponse.next();

  // Laisser passer /admin/** sans vérification [org]
  if (p.startsWith('/admin')) {
    return NextResponse.next();
  }

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