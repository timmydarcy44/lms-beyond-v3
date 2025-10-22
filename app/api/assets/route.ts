export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/lib/org';

export async function POST(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await getCurrentOrg();
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { 
      object_name, 
      filename, 
      file_size, 
      mime_type, 
      visibility_mode, 
      formation_id 
    } = await req.json();

    console.log('[TRACE] about to insert asset', { object_name, org_id: org.id, formation_id });

    const { data, error } = await sb.from('assets').insert({
      object_name,
      filename,
      file_size,
      mime_type,
      visibility_mode,
      org_id: org.id,
      formation_id: formation_id || null,
      created_by: user.id,
    }).select('id').single();

    if (error) {
      console.error('[ERROR] insert assets failed:', error);
      return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
    }

    console.log('[TRACE] asset created successfully', { asset_id: data.id });

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) {
    console.error('Error in assets API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
