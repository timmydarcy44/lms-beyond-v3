import type { NextRequest } from "next/server";
import { defaultLocalOrigin, publicAppUrl } from "@/lib/env";

export const ENTREPRISE_NEXT_PATH = "/dashboard/entreprise";

export function resolveEntrepriseAppOrigin(request: NextRequest): string {
  const configured = publicAppUrl();
  if (configured && configured !== defaultLocalOrigin) {
    return configured.replace(/^http:\/\//i, "https://").replace(/\/$/, "");
  }
  return request.nextUrl.origin.replace(/^http:\/\//i, "https://").replace(/\/$/, "");
}

export function entrepriseSetPasswordUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  const next = encodeURIComponent(ENTREPRISE_NEXT_PATH);
  return `${base}/auth/set-password?next=${next}&flow=entreprise`;
}
