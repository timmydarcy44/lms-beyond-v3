export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !anon) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing environment variables',
        hasUrl: !!url,
        hasAnon: !!anon
      });
    }

    // Test simple de l'URL Supabase
    const healthUrl = `${url}/auth/v1/health`;
    
    return NextResponse.json({ 
      ok: true, 
      url: url,
      healthUrl: healthUrl,
      message: 'Environment variables loaded correctly'
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    });
  }
}