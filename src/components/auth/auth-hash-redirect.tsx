"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  buildEdgeSetPasswordPath,
  decodeJwtPayload,
  resolveEdgeSignupFlowFromAccessToken,
} from "@/lib/auth/edge-signup-flow";
import {
  buildCollaboratorSetPasswordPath,
  isCollaboratorInviteMetadata,
} from "@/lib/entreprise/collaborator-invite";

/**
 * Supabase renvoie parfois les tokens (#access_token) sur la home si redirect_to
 * n'est pas autorisé. Route vers set-password avec le bon flow EDGE (entreprise vs particulier).
 */
export function AuthHashRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    if (pathname?.startsWith("/auth/")) return;

    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

    if (hashParams.get("error")) {
      const code = hashParams.get("error_code") || hashParams.get("error") || "auth";
      const accessToken = hashParams.get("access_token");
      const flow = accessToken ? resolveEdgeSignupFlowFromAccessToken(accessToken) : "particulier";
      const landing =
        flow === "entreprise"
          ? `/entreprises/connexion?auth_error=${encodeURIComponent(code)}`
          : `/particuliers?auth_error=${encodeURIComponent(code)}`;
      window.location.replace(landing);
      return;
    }

    const accessToken = hashParams.get("access_token");
    if (accessToken) {
      const payload = decodeJwtPayload(accessToken);
      const meta = (payload?.user_metadata ?? payload?.app_metadata) as Record<string, unknown> | undefined;
      if (isCollaboratorInviteMetadata(meta ?? null)) {
        window.location.replace(buildCollaboratorSetPasswordPath(hash));
        return;
      }
      const flow = resolveEdgeSignupFlowFromAccessToken(accessToken);
      window.location.replace(buildEdgeSetPasswordPath({ flow, hash }));
    }
  }, [pathname]);

  return null;
}
