"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NoteAppAuthGateProps = {
  children: React.ReactNode;
};

export function NoteAppAuthGate({ children }: NoteAppAuthGateProps) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const nextPath = useMemo(() => pathname || "/note-app", [pathname]);

  useEffect(() => {
    const extractTokens = () => {
      const candidates: string[] = [];
      if (window.location.hash) {
        candidates.push(window.location.hash.replace(/^#/, ""));
      }
      const hrefHash = window.location.href.split("#")[1];
      if (hrefHash) {
        candidates.push(hrefHash);
      }
      if (window.location.search) {
        candidates.push(window.location.search.replace(/^\?/, ""));
      }
      for (const candidate of candidates) {
        if (!candidate) continue;
        const params = new URLSearchParams(candidate);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          return { access_token, refresh_token };
        }
      }
      return null;
    };

    const syncSessionFromHash = async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        return false;
      }
      const tokens = extractTokens();
      if (!tokens) return false;
      await supabase.auth.setSession(tokens);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      return true;
    };

    const ensureSession = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) {
          window.location.href = `/app-landing/login?next=${encodeURIComponent(nextPath)}`;
          return;
        }
        await syncSessionFromHash();
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          window.location.href = `/app-landing/login?next=${encodeURIComponent(nextPath)}`;
          return;
        }
      } finally {
        setChecking(false);
      }
    };

    ensureSession();
  }, [nextPath]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#6B7280]">
        Chargement...
      </div>
    );
  }

  return <>{children}</>;
}
