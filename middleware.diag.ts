import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // When DIAG_BYPASS_MW=1, do nothing (bypass all middleware logic)
  if (process.env.DIAG_BYPASS_MW === '1') {
    return NextResponse.next();
  }
  // Fallback: also do nothing here to avoid accidental loops during diagnostics
  return NextResponse.next();
}

export const config = {
  // Apply to all paths except Next internals and static files
  matcher: ['/((?!_next|__csp|__env|diag|_ping|api/ping|favicon.ico).*)'],
};




