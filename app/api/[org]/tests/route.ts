// app/api/[org]/tests/route.ts
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
      .from('tests')
      .select(`
        *,
        test_assignments(count)
      `)
      .eq('org_id', orgRow.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tests:', error);
      return NextResponse.json({ ok: false, error: 'Failed to fetch tests' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tests: data });
  } catch (error) {
    console.error('Error in tests API:', error);
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
    const { title, description, embed_url, type, published } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Title is required' }, { status: 400 });
    }

    if (!embed_url || embed_url.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Embed URL is required' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('tests')
      .insert({
        title: title.trim(),
        description: description?.trim() || '',
        embed_url: embed_url.trim(),
        type: type || 'typeform',
        published: published || false,
        org_id: orgRow.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test:', error);
      return NextResponse.json({ ok: false, error: 'Failed to create test' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, test: data });
  } catch (error) {
    console.error('Error in tests API:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
