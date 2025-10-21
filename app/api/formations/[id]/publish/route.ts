import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getCurrentOrgId } from '@/lib/org';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('formations')
      .update({ published: true })
      .eq('id', params.id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Error publishing formation:', error);
      return NextResponse.json({ error: 'Failed to publish formation' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in formation publish API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
