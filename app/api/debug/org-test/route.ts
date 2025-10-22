export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgSlug = searchParams.get('slug');
  
  if (!orgSlug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }

  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Test de résolution d'organisation
    const { data: org } = await sb
      .from('organizations')
      .select('id, slug, name')
      .eq('slug', orgSlug)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data: membership } = await sb
      .from('org_memberships')
      .select('role')
      .eq('org_id', org.id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      org: {
        id: org.id,
        slug: org.slug,
        name: org.name
      },
      membership: {
        role: membership.role
      },
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error in org test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
