// app/api/[org]/resources/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getOrgBySlug, getSessionUser, requireOrgAccess } from '@/lib/orgs';

// Typage Next 15 : params est une Promise
type Ctx = { params: Promise<{ org: string }> };

export async function GET(req: NextRequest, context: Ctx) {
  try {
    const { org } = await context.params;
    const sb = await supabaseServer();
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });
    }

    const orgRow = await getOrgBySlug(org);
    if (!orgRow) {
      return NextResponse.json({ ok: false, error: 'ORG_NOT_FOUND' }, { status: 404 });
    }

    await requireOrgAccess(user.id, orgRow.id);

    const { data, error } = await sb
      .from('resources')
      .select(`
        *,
        resource_assignments(count)
      `)
      .eq('org_id', orgRow.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resources:', error);
      return NextResponse.json({ ok: false, error: 'Failed to fetch resources' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, resources: data });
  } catch (error) {
    console.error('Error in resources API:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: Ctx) {
  try {
    const { org } = await context.params;
    const sb = await supabaseServer();
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });
    }

    const orgRow = await getOrgBySlug(org);
    if (!orgRow) {
      return NextResponse.json({ ok: false, error: 'ORG_NOT_FOUND' }, { status: 404 });
    }

    await requireOrgAccess(user.id, orgRow.id);

    const body = await req.json();
    const { title, description, type, file_url, external_url, price, published } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Title is required' }, { status: 400 });
    }

    if (!type || !['pdf', 'video', 'audio', 'image', 'youtube', 'link'].includes(type)) {
      return NextResponse.json({ ok: false, error: 'Valid type is required' }, { status: 400 });
    }

    if (!file_url && !external_url) {
      return NextResponse.json({ ok: false, error: 'file_url or external_url is required' }, { status: 400 });
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
        org_id: orgRow.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating resource:', error);
      return NextResponse.json({ ok: false, error: 'Failed to create resource' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, resource: data });
  } catch (error) {
    console.error('Error in resources API:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
