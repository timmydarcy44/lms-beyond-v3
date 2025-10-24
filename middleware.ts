import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;
  const single = process.env.SINGLE_ORG_SLUG;

  // Legacy redirect
  if (path === "/login/admin") { 
    url.pathname = "/login"; 
    return NextResponse.redirect(url); 
  }

  // /admin root redirect
  if (path === "/admin") {
    url.pathname = single ? `/admin/${single}` : "/org-picker";
    return NextResponse.redirect(url);
  }

  // Slug normalization to lowercase (308 redirect)
  const m = path.match(/^\/(admin|app)\/([^/]+)(.*)$/);
  if (m) {
    const seg = m[1], slug = m[2], rest = m[3] || "";
    const clean = slug.toLowerCase().trim();
    if (clean !== slug) {
      url.pathname = `/${seg}/${clean}${rest}`;
      return NextResponse.redirect(url, 308);
    }
  }

  return NextResponse.next();
}

export const config = { 
  matcher: [
    "/admin", 
    "/admin/:path*", 
    "/app/:path*", 
    "/login/admin"
  ] 
};