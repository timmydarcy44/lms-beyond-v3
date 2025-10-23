// app/api/[org]/pathways/[id]/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getOrgBySlug, getSessionUser, requireOrgAccess } from '@/lib/orgs';

// Typage Next 15 : params est une Promise
type Ctx = { params: Promise<{ org: string; id: string }> };

export async function GET(req: NextRequest, context: Ctx) {
  try {
    const { org, id } = await context.params;
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
      .eq('id', id)
      .eq('org_id', orgRow.id)
      .single();

    if (error) {
      console.error('Error fetching pathway:', error);
      return NextResponse.json({ ok: false, error: 'Pathway not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, pathway: data });
  } catch (error) {
    console.error('Error in pathway API:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: Ctx) {
  try {
    const { org, id } = await context.params;
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
    const { title, description, cover_url, published } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Title is required' }, { status: 400 });
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
      .eq('id', id)
      .eq('org_id', orgRow.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pathway:', error);
      return NextResponse.json({ ok: false, error: 'Failed to update pathway' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pathway: data });
  } catch (error) {
    console.error('Error in pathway API:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
