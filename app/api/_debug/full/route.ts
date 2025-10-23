export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[API_DIAGNOSTIC] Starting API diagnostic...');
    
    // Test 1: Environment variables
    const envCheck = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
    
    console.log('[API_DIAGNOSTIC] Environment check:', envCheck);
    
    // Test 2: Try to import and create Supabase client
    let supabaseTest = null;
    try {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const sb = await supabaseServer();
      supabaseTest = 'Client created successfully';
      console.log('[API_DIAGNOSTIC] Supabase client created');
    } catch (error) {
      supabaseTest = `Error: ${error instanceof Error ? error.message : String(error)}`;
      console.error('[API_DIAGNOSTIC] Supabase error:', error);
    }
    
    // Test 3: Try to import org functions
    let orgTest = null;
    try {
      const { getSessionUser } = await import('@/lib/orgs');
      const user = await getSessionUser();
      orgTest = user ? `User found: ${user.email}` : 'No user authenticated';
      console.log('[API_DIAGNOSTIC] Org functions work');
    } catch (error) {
      orgTest = `Error: ${error instanceof Error ? error.message : String(error)}`;
      console.error('[API_DIAGNOSTIC] Org functions error:', error);
    }
    
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabase: supabaseTest,
      orgs: orgTest,
    });
  } catch (error) {
    console.error('[API_DIAGNOSTIC] Fatal error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    }, { status: 500 });
  }
}
