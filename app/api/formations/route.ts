import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/lib/org';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await getCurrentOrg();
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

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
        org_id: org.id,
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
