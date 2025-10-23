// app/api/env-check/route.ts
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
export async function GET() {
  const has = (k: string) => Boolean(process.env[k]);
  return NextResponse.json({
    SUPABASE_URL: has('SUPABASE_URL'),
    SUPABASE_ANON_KEY: has('SUPABASE_ANON_KEY'),
    NEXT_PUBLIC_SUPABASE_URL: has('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: has('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  });
}
