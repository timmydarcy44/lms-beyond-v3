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
      .from('tests')
      .select(`
        *,
        test_assignments(count)
      `)
      .eq('org_id', org.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tests:', error);
      return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
    }

    return NextResponse.json({ tests: data });
  } catch (error) {
    console.error('Error in tests API:', error);
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
    const { title, description, embed_url, type, published } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!embed_url || embed_url.trim().length === 0) {
      return NextResponse.json({ error: 'Embed URL is required' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('tests')
      .insert({
        title: title.trim(),
        description: description?.trim() || '',
        embed_url: embed_url.trim(),
        type: type || 'typeform',
        published: published || false,
        org_id: org.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test:', error);
      return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, test: data });
  } catch (error) {
    console.error('Error in tests API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
