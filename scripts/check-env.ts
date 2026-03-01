#!/usr/bin/env tsx
import {
  getRawEnv,
  getSupabaseEnvDiagnostics,
  getSupabaseUrl,
} from "@/lib/env/supabase-env";

const runtime = process.env.VERCEL === "1" ? "vercel" : "local";
const nodeEnvRaw = process.env.NODE_ENV;
const nodeEnv =
  nodeEnvRaw === "production"
    ? "production"
    : nodeEnvRaw === "test"
      ? "test"
      : "development";

const diagnostics = getSupabaseEnvDiagnostics();
const rawUrl =
  getRawEnv("NEXT_PUBLIC_SUPABASE_URL") ?? getRawEnv("SUPABASE_URL");
const trimmedUrl = getSupabaseUrl();

if (rawUrl && rawUrl !== rawUrl.trim()) {
  console.warn(
    "[env] Warning: SUPABASE_URL contains leading/trailing whitespace. Please trim the value in your .env file.",
  );
}

if (diagnostics.hasSupabaseUrl && !diagnostics.supabaseUrlLooksValid) {
  console.warn(
    "[env] Warning: SUPABASE_URL does not look like a https://*.supabase.co URL.",
  );
}

const summary = {
  nodeEnv,
  hasSupabaseUrl: diagnostics.hasSupabaseUrl,
  hasServiceRoleKey: diagnostics.hasServiceRoleKey,
  supabaseUrlLooksValid: diagnostics.supabaseUrlLooksValid,
};

console.log(JSON.stringify(summary, null, 2));
