import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

function isAllowedUrl(u: URL) {
  if (u.protocol !== "https:") return false;
  // Autoriser uniquement Supabase (logos / buckets)
  const host = u.hostname.toLowerCase();
  if (host === "zmcefidiiqqppowymoqb.supabase.co") return true;
  // fallback: toute instance supabase.co (si besoin), mais toujours https
  if (host.endsWith(".supabase.co")) return true;
  return false;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("url") ?? "").trim();
  if (!raw) {
    return new Response("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!isAllowedUrl(target)) {
    return new Response("Host not allowed", { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    // Some buckets require these headers to be absent; keep minimal.
    redirect: "follow",
  });

  if (!upstream.ok) {
    return new Response(`Upstream error ${upstream.status}`, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = upstream.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BYTES) {
    return new Response("File too large", { status: 413 });
  }

  const buf = await upstream.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return new Response("File too large", { status: 413 });
  }

  return new Response(buf, {
    status: 200,
    headers: {
      "content-type": contentType,
      // Cache côté navigateur/CDN
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

