// app/api/[org]/formations/[id]/route.ts
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
      .from('formations')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgRow.id)
      .single();

    if (error) {
      console.error('Error fetching formation:', error);
      return NextResponse.json({ ok: false, error: 'Formation not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Error in formation API:', error);
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

    const { data, error } = await sb
      .from('formations')
      .update(body)
      .eq('id', id)
      .eq('org_id', orgRow.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating formation:', error);
      return NextResponse.json({ ok: false, error: 'Failed to update formation' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Error in formation API:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
