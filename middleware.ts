import { NextResponse } from 'next/server';

export function middleware() {
  // Pas de logique de redirection ici pour /admin ou /login.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};