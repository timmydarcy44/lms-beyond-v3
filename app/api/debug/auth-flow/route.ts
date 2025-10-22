export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const sb = await supabaseServer();
    const { data: { user }, error: authError } = await sb.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: authError.message,
        status: 'NOT_AUTHENTICATED'
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No user', 
        status: 'NOT_AUTHENTICATED'
      }, { status: 401 });
    }

    // Tester les organisations
    const { data: memberships, error: membershipsError } = await sb
      .from('org_memberships')
      .select('organizations!inner(slug,name)')
      .eq('user_id', user.id);

    if (membershipsError) {
      return NextResponse.json({ 
        error: 'Memberships error', 
        details: membershipsError.message,
        user: { id: user.id, email: user.email },
        status: 'MEMBERSHIPS_ERROR'
      }, { status: 500 });
    }

    const orgs = (memberships || []).map((r: any) => r.organizations);

    return NextResponse.json({
      status: 'SUCCESS',
      user: { id: user.id, email: user.email },
      organizations: orgs,
      orgCount: orgs.length,
      shouldRedirect: orgs.length === 1 ? `/admin/${orgs[0].slug}/dashboard` : '/admin/choice'
    });

  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 'SERVER_ERROR'
    }, { status: 500 });
  }
}
