export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export async function GET() {
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasSiteUrl = !!process.env.NEXT_PUBLIC_SITE_URL;
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    supabase: {
      url: hasSupabaseUrl ? 'SET' : 'MISSING',
      anonKey: hasSupabaseAnon ? 'SET' : 'MISSING',
      serviceRole: hasServiceRole ? 'SET' : 'MISSING',
    },
    site: {
      url: hasSiteUrl ? 'SET' : 'MISSING',
    },
    allEnvVars: {
      NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasSupabaseAnon,
      SUPABASE_SERVICE_ROLE_KEY: hasServiceRole,
      NEXT_PUBLIC_SITE_URL: hasSiteUrl,
    }
  });
}
