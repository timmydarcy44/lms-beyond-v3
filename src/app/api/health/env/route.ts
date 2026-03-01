import { NextResponse } from "next/server";

import { getSupabaseEnvDiagnostics } from "@/lib/env/supabase-env";

export async function GET() {
  const runtime = process.env.VERCEL === "1" ? "vercel" : "local";
  const nodeEnv =
    process.env.NODE_ENV === "production" ? "production" : "development";
  const diagnostics = getSupabaseEnvDiagnostics();

  return NextResponse.json({
    runtime,
    nodeEnv,
    hasSupabaseUrl: diagnostics.hasSupabaseUrl,
    hasServiceRoleKey: diagnostics.hasServiceRoleKey,
    supabaseUrlLooksValid: diagnostics.supabaseUrlLooksValid,
    hasLegacyServiceRoleKeyName: diagnostics.hasLegacyServiceRoleKeyName,
  });
}
