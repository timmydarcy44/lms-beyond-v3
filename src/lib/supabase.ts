import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase navigateur pour les composants / hooks client uniquement.
 * (null si variables d’environnement publiques absentes.)
 */
export const supabase: SupabaseClient | null = createSupabaseBrowserClient();
