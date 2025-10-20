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
      .from('resources')
      .select(`
        *,
        resource_assignments(count)
      `)
      .eq('org_id', org.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resources:', error);
      return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }

    return NextResponse.json({ resources: data });
  } catch (error) {
    console.error('Error in resources API:', error);
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
    const { title, description, type, file_url, external_url, price, published } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!type || !['pdf', 'video', 'audio', 'image', 'youtube', 'link'].includes(type)) {
      return NextResponse.json({ error: 'Valid type is required' }, { status: 400 });
    }

    if (!file_url && !external_url) {
      return NextResponse.json({ error: 'file_url or external_url is required' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('resources')
      .insert({
        title: title.trim(),
        description: description?.trim() || '',
        type,
        file_url: file_url || null,
        external_url: external_url || null,
        price: price || 0,
        published: published || false,
        org_id: org.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating resource:', error);
      return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, resource: data });
  } catch (error) {
    console.error('Error in resources API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
