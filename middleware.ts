import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Laisse passer /login, /api, assets…
  if (path.startsWith('/login') || path.startsWith('/api') || path.startsWith('/_next') || path.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Laisse passer /admin (root) pour que la page server redirige vers /admin/[slug]
  if (path === '/admin') return NextResponse.next();
  if (path === '/formateur') return NextResponse.next();
  if (path === '/tuteur') return NextResponse.next();
  if (path === '/apprenant') return NextResponse.next();

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