import type { NextRequest } from "next/server";
import { defaultLocalOrigin, publicAppUrl } from "@/lib/env";

export const EXPERT_NEXT_PATH = "/dashboard/expert";
export const EXPERT_SIGNUP_FLOW = "expert" as const;

export function resolveExpertAppOrigin(request: NextRequest): string {
  const configured = publicAppUrl();
  if (configured && configured !== defaultLocalOrigin) {
    return configured.replace(/^http:\/\//i, "https://").replace(/\/$/, "");
  }
  return request.nextUrl.origin.replace(/^http:\/\//i, "https://").replace(/\/$/, "");
}

export function expertSetPasswordUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  const next = encodeURIComponent(EXPERT_NEXT_PATH);
  return `${base}/auth/set-password?next=${next}&flow=${EXPERT_SIGNUP_FLOW}`;
}

export function expertSetPasswordPath(): string {
  const next = encodeURIComponent(EXPERT_NEXT_PATH);
  return `/auth/set-password?next=${next}&flow=${EXPERT_SIGNUP_FLOW}`;
}
