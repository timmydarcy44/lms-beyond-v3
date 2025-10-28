/**
 * 🔒 AUTH CORE — NE PAS MODIFIER.
 * Toute modification ici doit être validée par code review.
 * Implémentation figée: createBrowserClient pour composants client uniquement.
 * PAS d'import direct de @supabase/ssr ailleurs.
 */

"use client";
import { createBrowserClient } from "@supabase/ssr";

export const createSupabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Aliases pour compatibilité
export const supabaseClient = createSupabaseBrowser;
export const createClient = createSupabaseBrowser;