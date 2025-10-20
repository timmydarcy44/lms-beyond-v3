import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/lib/org';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
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
        pathway_items(count),
        pathway_assignments(count)
      `)
      .eq('org_id', org.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pathways:', error);
      return NextResponse.json({ error: 'Failed to fetch pathways' }, { status: 500 });
    }

    return NextResponse.json({ pathways: data });
  } catch (error) {
    console.error('Error in pathways API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { title, description, cover_url, published } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('pathways')
      .insert({
        title: title.trim(),
        description: description?.trim() || '',
        cover_url,
        published: published || false,
        org_id: org.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pathway:', error);
      return NextResponse.json({ error: 'Failed to create pathway' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pathway: data });
  } catch (error) {
    console.error('Error in pathways API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
