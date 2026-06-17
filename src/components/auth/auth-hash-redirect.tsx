"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const DEFAULT_PARTICULIER_NEXT = "/dashboard/apprenant/test-comportemental-intro";

/**
 * Supabase renvoie parfois les tokens (#access_token) ou erreurs (#error=…) sur la home
 * si l'URL de redirection n'est pas autorisée. On redirige vers le bon écran.
 */
export function AuthHashRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    if (pathname?.startsWith("/auth/")) return;

    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const next = encodeURIComponent(DEFAULT_PARTICULIER_NEXT);

    if (hashParams.get("error")) {
      const code = hashParams.get("error_code") || hashParams.get("error") || "auth";
      window.location.replace(`/particuliers?auth_error=${encodeURIComponent(code)}`);
      return;
    }

    if (hashParams.get("access_token")) {
      window.location.replace(`/auth/set-password?next=${next}&flow=particulier${hash}`);
    }
  }, [pathname]);

  return null;
}
