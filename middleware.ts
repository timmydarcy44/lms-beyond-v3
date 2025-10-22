import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // toujours ok
  if (
    p.startsWith('/login') ||
    p.startsWith('/api') ||
    p.startsWith('/_next') ||
    p.startsWith('/favicon') ||
    p.startsWith('/public')
  ) return NextResponse.next();

  // laisser les Server Components décider
  if (
    p === '/admin' ||
    p.startsWith('/admin/choice') ||
    /^\/admin\/[^\/]+/.test(p)
  ) return NextResponse.next();

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