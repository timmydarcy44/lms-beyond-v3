"use client";

import { createContext, useContext, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SupabaseProviderValue = {
  supabase: SupabaseClient;
};

export const SupabaseContext = createContext<SupabaseProviderValue | null>(null);

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-center text-sm text-muted-foreground">
        Supabase n&apos;est pas configuré. Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.
      </div>
    );
  }

  return <SupabaseContext.Provider value={{ supabase }}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return context.supabase;
};


