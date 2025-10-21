// app/api/debug/timmy-org/route.ts
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

    console.log('🔍 Debug Timmy Org - User:', user.email);

    // Vérifier les organisations
    const { data: orgs, error: orgsError } = await sb
      .from('organizations')
      .select('*');

    // Vérifier les membres d'organisation
    const { data: memberships, error: membershipsError } = await sb
      .from('org_memberships')
      .select(`
        *,
        organizations(*)
      `)
      .eq('user_id', user.id);

    // Vérifier les formations de l'utilisateur
    const { data: formations, error: formationsError } = await sb
      .from('formations')
      .select('*')
      .eq('created_by', user.id);

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
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
