import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/lib/org';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { data, error } = await sb
      .from('pathways')
      .select(`
        *,
        pathway_items(
          *,
          formations(title, cover_url),
          tests(title, embed_url),
          resources(title, file_url, type)
        )
      `)
      .eq('id', params.id)
      .eq('org_id', org.id)
      .single();

    if (error) {
      console.error('Error fetching pathway:', error);
      return NextResponse.json({ error: 'Pathway not found' }, { status: 404 });
    }

    return NextResponse.json({ pathway: data });
  } catch (error) {
    console.error('Error in pathway API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    const { title, description, cover_url, published } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('pathways')
      .update({
        title: title.trim(),
        description: description?.trim() || '',
        cover_url,
        published: published !== undefined ? published : false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('org_id', org.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pathway:', error);
      return NextResponse.json({ error: 'Failed to update pathway' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pathway: data });
  } catch (error) {
    console.error('Error in pathway API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
