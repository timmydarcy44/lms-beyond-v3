import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentOrg } from '@/lib/org';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const sb = await supabaseServer();
    const admin = supabaseAdmin();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await getCurrentOrg();
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const body = await req.json();
    const { items } = body;

    // Vérifier que le parcours appartient à l'org
    const { data: pathway, error: pathwayError } = await sb
      .from('pathways')
      .select('id')
      .eq('id', params.id)
      .eq('org_id', org.id)
      .single();

    if (pathwayError || !pathway) {
      return NextResponse.json({ error: 'Pathway not found' }, { status: 404 });
    }

    // Ajouter les items au parcours
    if (items && items.length > 0) {
      const pathwayItems = items.map((item: any) => ({
        pathway_id: params.id,
        content_id: item.content_id,
        content_type: item.content_type,
        position: item.position || 1,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await admin
        .from('pathway_items')
        .upsert(pathwayItems, {
          onConflict: 'pathway_id,content_id,content_type'
        });

      if (itemsError) {
        console.error('Error adding items to pathway:', itemsError);
        return NextResponse.json({ error: 'Failed to add items to pathway' }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in pathway items API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}