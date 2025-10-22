// app/api/debug/production-error/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Test 1: Variables d'environnement
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? 'SET' : 'MISSING',
    };

    // Test 2: Import dynamique de Supabase
    let supabaseTest;
    try {
      const { supabaseServer } = await import('@/lib/supabase/server');
      supabaseTest = 'IMPORT_SUCCESS';
      
      // Test 3: Création du client
      const sb = await supabaseServer();
      supabaseTest = 'CLIENT_CREATED';
      
      // Test 4: Auth getUser
      const { data: { user }, error: userError } = await sb.auth.getUser();
      supabaseTest = userError ? `AUTH_ERROR: ${userError.message}` : 'AUTH_SUCCESS';
      
    } catch (error) {
      supabaseTest = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    // Test 5: Import du helper org-server
    let orgServerTest;
    try {
      const { getUserOrganizations } = await import('@/lib/org-server');
      orgServerTest = 'IMPORT_SUCCESS';
      
      // Test 6: Appel de la fonction
      const orgs = await getUserOrganizations();
      orgServerTest = `SUCCESS: ${orgs.length} orgs`;
      
    } catch (error) {
      orgServerTest = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envVars,
      supabaseTest,
      orgServerTest,
      url: req.url,
      headers: {
        host: req.headers.get('host'),
        'user-agent': req.headers.get('user-agent'),
        'x-forwarded-for': req.headers.get('x-forwarded-for'),
        'x-forwarded-host': req.headers.get('x-forwarded-host'),
        'x-forwarded-proto': req.headers.get('x-forwarded-proto'),
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error in production debug',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
