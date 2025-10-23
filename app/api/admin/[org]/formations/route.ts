import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getOrgBySlug, getSessionUser, requireOrgAccess } from '@/lib/orgs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, context: { params: Promise<{ org: string }> }) {
  try {
    const { org } = await context.params;
    const sb = await supabaseServer();
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgRow = await getOrgBySlug(org);
    if (!orgRow) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    await requireOrgAccess(user.id, orgRow.id);

    const body = await req.json();
    const { title, description, cover_url, visibility_mode, published, theme } = body;

    const { data, error } = await sb
      .from('formations')
      .insert({
        title,
        description,
        cover_url,
        visibility_mode: visibility_mode || 'catalog_only',
        published: published || false,
        org_id: orgRow.id,
        created_by: user.id,
        theme: theme || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating formation:', error);
      return NextResponse.json({ error: 'Failed to create formation' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in formations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
