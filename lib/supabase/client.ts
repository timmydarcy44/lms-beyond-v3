"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function sbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClientComponentClient({ supabaseUrl: url, supabaseKey: key });
}

// Alias pour compatibilité avec l'ancien code
export const supabaseBrowser = sbClient;