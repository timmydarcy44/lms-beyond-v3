import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedServiceClient: SupabaseClient | null = null;

export async function getServiceSupabase() {
  if (cachedServiceClient) {
    return cachedServiceClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SERVICE_NOT_CONFIGURED");
  }

  cachedServiceClient = createClient<any>(url, key, {
    auth: { persistSession: false },
  });

  return cachedServiceClient;
}
