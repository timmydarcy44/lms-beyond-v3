import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Redirection /login/admin -> /login
  if (pathname === '/login/admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 2. Redirection /admin -> org par défaut ou org-picker
  if (pathname === '/admin') {
    const singleOrgSlug = process.env.SINGLE_ORG_SLUG;
    if (singleOrgSlug) {
      return NextResponse.redirect(new URL(`/admin/${singleOrgSlug.toLowerCase()}`, request.url));
    }
    return NextResponse.redirect(new URL('/org-picker', request.url));
  }
  
  // 3. Normalisation des slugs en minuscule (308 redirect)
  const orgMatch = pathname.match(/^\/(admin|app)\/([^\/]+)/);
  if (orgMatch) {
    const [, prefix, orgSlug] = orgMatch;
    if (orgSlug !== orgSlug.toLowerCase()) {
      const normalizedPath = pathname.replace(`/${orgSlug}`, `/${orgSlug.toLowerCase()}`);
      return NextResponse.redirect(new URL(normalizedPath, request.url), 308);
    }
  }
  
  // 4. Validation des slugs d'org
  const orgPathMatch = pathname.match(/^\/(admin|app)\/([^\/]+)/);
  if (orgPathMatch) {
    const [, prefix, orgSlug] = orgPathMatch;
    
    // Slug vide ou invalide -> 404
    if (!orgSlug || orgSlug.length === 0 || orgSlug.includes('/')) {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    // Vérifier si l'utilisateur est authentifié
    const authToken = request.cookies.get('sb-access-token')?.value;
    if (!authToken) {
      // Non authentifié -> redirect vers login avec org et next
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('org', orgSlug);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl, 302);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login/admin',
    '/admin',
    '/admin/:path*',
    '/app/:path*',
    '/org-picker',
    '/switch-org'
  ]
};