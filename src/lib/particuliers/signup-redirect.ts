import type { NextRequest } from "next/server";
import { defaultLocalOrigin, publicAppUrl } from "@/lib/env";

const PARTICULIER_NEXT_PATH = "/dashboard/apprenant/test-comportemental-intro";

/** Origine publique HTTPS (edgebs.fr en prod). */
export function resolveParticulierAppOrigin(request: NextRequest): string {
  const configured = publicAppUrl();
  if (configured && configured !== defaultLocalOrigin) {
    return configured.replace(/^http:\/\//i, "https://").replace(/\/$/, "");
  }
  return request.nextUrl.origin.replace(/^http:\/\//i, "https://").replace(/\/$/, "");
}

export function particulierSetPasswordUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  const next = encodeURIComponent(PARTICULIER_NEXT_PATH);
  return `${base}/auth/set-password?next=${next}&flow=particulier`;
}

export function particulierAuthCallbackUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  const next = encodeURIComponent(PARTICULIER_NEXT_PATH);
  return `${base}/auth/callback?next=${next}&type=signup`;
}

export { PARTICULIER_NEXT_PATH };
