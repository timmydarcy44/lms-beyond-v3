"use client";

import { ReactNode, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SupabaseSessionProvider({ children }: { children: ReactNode }) {
  const supabase = createClientComponentClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Synchronise les cookies côté serveur à chaque changement d'état
      await fetch("/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, session }),
      });
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return <>{children}</>;
}
