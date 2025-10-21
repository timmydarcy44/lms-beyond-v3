// app/api/debug/server-error/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    console.log('🔍 Debug Server Error - User:', user.email);

    // Test des organisations
    const { data: orgs, error: orgsError } = await sb
      .from('organizations')
      .select('*');

    // Test des membres d'organisation
    const { data: memberships, error: membershipsError } = await sb
      .from('org_memberships')
      .select(`
        *,
        organizations(*)
      `)
      .eq('user_id', user.id);

    // Test des formations
    const { data: formations, error: formationsError } = await sb
      .from('formations')
      .select('*')
      .limit(5);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      organizations: {
        data: orgs,
        error: orgsError
      },
      memberships: {
        data: memberships,
        error: membershipsError
      },
      formations: {
        data: formations,
        error: formationsError
      },
      url: req.url,
      headers: {
        host: req.headers.get('host'),
        'x-forwarded-host': req.headers.get('x-forwarded-host'),
        'x-forwarded-proto': req.headers.get('x-forwarded-proto')
      }
    });
  } catch (error) {
    console.error('🔍 Debug Server Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
