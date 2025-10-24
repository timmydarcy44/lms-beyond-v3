import { NextResponse } from "next/server";

const WINDOW_MS = 60_000; // 1 minute
const MAX = 60; // 60 req/min/IP
const store = new Map<string, { count: number; ts: number }>();

export function middleware(req: Request) {
  const url = new URL(req.url);
  
  // Only apply rate limiting to API routes
  if (!url.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const key = `${ip}:${url.pathname}:${req.method}`;
  const now = Date.now();
  const cur = store.get(key);

  if (!cur || now - cur.ts > WINDOW_MS) {
    // New window or first request
    store.set(key, { count: 1, ts: now });
  } else {
    // Within window, increment counter
    cur.count++;
    if (cur.count > MAX) {
      return NextResponse.json(
        { ok: false, error: "RATE_LIMIT", code: "429" },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};