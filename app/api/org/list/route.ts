// app/api/org/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer toutes les organisations de l'utilisateur
    const { data: memberships, error } = await sb
      .from('org_memberships')
      .select(`
        organizations!inner(
          id,
          slug,
          name
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    const organizations = memberships?.map((m: any) => m.organizations) || [];

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Error in org list API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
