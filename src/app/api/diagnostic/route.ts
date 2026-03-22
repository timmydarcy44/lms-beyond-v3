import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    gemini: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
  };

  console.log("[DIAGNOSTIC] Environment:", config);

  return NextResponse.json({
    status: Object.values(config).every((v) => v === true)
      ? "ALL_READY"
      : "MISSING_VARIABLES",
    details: config,
  });
}
