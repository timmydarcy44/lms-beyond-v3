import { ENTREPRISE_NEXT_PATH } from "@/lib/entreprise/signup-redirect";
import { EXPERT_NEXT_PATH } from "@/lib/expert/signup-redirect";
import { PARTICULIER_NEXT_PATH } from "@/lib/particuliers/signup-redirect";

export type EdgeSignupFlow = "entreprise" | "particulier" | "expert";

export const EDGE_PARTICULIER_SET_PASSWORD_NEXT = PARTICULIER_NEXT_PATH;
export const EDGE_ENTREPRISE_SET_PASSWORD_NEXT = ENTREPRISE_NEXT_PATH;
export const EDGE_EXPERT_SET_PASSWORD_NEXT = EXPERT_NEXT_PATH;

export function isEdgeExpertSignupMetadata(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false;
  const accountType = String(metadata.account_type ?? "").trim().toLowerCase();
  const signupSource = String(metadata.signup_source ?? "").trim().toLowerCase();
  const roleType = String(metadata.role_type ?? "").trim().toLowerCase();
  return accountType === "expert" || signupSource === "edge_expert" || roleType === "expert";
}

export function isEdgeEntrepriseSignupMetadata(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false;
  const accountType = String(metadata.account_type ?? "").trim().toLowerCase();
  const signupSource = String(metadata.signup_source ?? "").trim().toLowerCase();
  const roleType = String(metadata.role_type ?? "").trim().toLowerCase();
  return (
    accountType === "entreprise" ||
    signupSource === "edge_entreprises" ||
    roleType === "entreprise" ||
    roleType === "admin_hr"
  );
}

export function resolveEdgeSignupFlowFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): EdgeSignupFlow {
  if (isEdgeExpertSignupMetadata(metadata)) return "expert";
  return isEdgeEntrepriseSignupMetadata(metadata) ? "entreprise" : "particulier";
}

export function defaultNextPathForEdgeFlow(flow: EdgeSignupFlow): string {
  if (flow === "entreprise") return EDGE_ENTREPRISE_SET_PASSWORD_NEXT;
  if (flow === "expert") return EDGE_EXPERT_SET_PASSWORD_NEXT;
  return EDGE_PARTICULIER_SET_PASSWORD_NEXT;
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function resolveEdgeSignupFlowFromAccessToken(accessToken: string): EdgeSignupFlow {
  const payload = decodeJwtPayload(accessToken);
  const userMetadata = (payload?.user_metadata ?? payload?.app_metadata) as Record<string, unknown> | undefined;
  return resolveEdgeSignupFlowFromMetadata(userMetadata ?? null);
}

export function buildEdgeSetPasswordPath(params: {
  flow: EdgeSignupFlow;
  nextPath?: string;
  hash?: string;
}): string {
  const next = encodeURIComponent(params.nextPath ?? defaultNextPathForEdgeFlow(params.flow));
  const hash = params.hash?.startsWith("#") ? params.hash : params.hash ? `#${params.hash}` : "";
  return `/auth/set-password?next=${next}&flow=${params.flow}${hash}`;
}

export function resolveEdgeFlowFromNextPath(nextPath: string | null | undefined): EdgeSignupFlow | null {
  const decoded = String(nextPath ?? "").trim();
  if (!decoded) return null;
  if (decoded.includes("/dashboard/entreprise") || decoded.includes("/onboarding/")) {
    return "entreprise";
  }
  if (decoded.includes("/dashboard/expert")) {
    return "expert";
  }
  if (decoded.includes("/dashboard/apprenant") || decoded.includes("/particuliers")) {
    return "particulier";
  }
  return null;
}
