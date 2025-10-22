// app/api/debug/auth-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug Auth Session - Starting...');
    
    // Vérifier les variables d'environnement
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    };
    
    console.log('Environment variables check:', envCheck);
    
    // Vérifier les cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('sb-') ||
      cookie.name.includes('auth')
    );
    
    console.log('Supabase cookies found:', supabaseCookies.length);
    
    // Vérifier les headers
    const headersList = await headers();
    const authHeaders = {
      authorization: headersList.get('authorization'),
      cookie: headersList.get('cookie'),
      'x-forwarded-for': headersList.get('x-forwarded-for'),
      'x-forwarded-host': headersList.get('x-forwarded-host'),
      'x-forwarded-proto': headersList.get('x-forwarded-proto'),
    };
    
    console.log('Auth headers:', authHeaders);
    
    // Test de création du client Supabase
    let sb;
    try {
      sb = await supabaseServer();
      console.log('✅ Supabase client created successfully');
    } catch (error) {
      console.error('❌ Supabase client creation failed:', error);
      return NextResponse.json({ 
        error: 'Supabase client creation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'clientCreation'
      }, { status: 500 });
    }
    
    // Test d'authentification
    let authResult;
    try {
      authResult = await sb.auth.getUser();
      console.log('✅ Auth getUser completed');
    } catch (error) {
      console.error('❌ Auth getUser failed:', error);
      return NextResponse.json({ 
        error: 'Auth getUser failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'authGetUser',
        envCheck,
        cookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        headers: authHeaders
      }, { status: 500 });
    }
    
    const { data: { user }, error: userError } = authResult;
    
    if (userError) {
      console.error('❌ User error:', userError);
      return NextResponse.json({ 
        error: 'User error',
        details: userError.message,
        step: 'userError',
        envCheck,
        cookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        headers: authHeaders
      }, { status: 401 });
    }
    
    if (!user) {
      console.log('⚠️ No user found');
      return NextResponse.json({ 
        error: 'No user found',
        step: 'noUser',
        envCheck,
        cookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        headers: authHeaders
      }, { status: 401 });
    }
    
    console.log('✅ User authenticated:', user.email);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      envCheck,
      cookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      headers: authHeaders,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 Debug Auth Session - Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error in auth session debug',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      step: 'unexpected'
    }, { status: 500 });
  }
}
