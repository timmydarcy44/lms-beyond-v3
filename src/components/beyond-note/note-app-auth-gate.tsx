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
    const syncSessionFromHash = async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        return false;
      }
      if (!window.location.hash) {
        return false;
      }
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return false;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        return true;
      }
      return false;
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
