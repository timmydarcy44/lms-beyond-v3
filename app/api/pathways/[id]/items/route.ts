import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/lib/org';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
    }

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

    // Supprimer les items existants
    await sb
      .from('pathway_items')
      .delete()
      .eq('pathway_id', params.id);

    // Insérer les nouveaux items
    if (items.length > 0) {
      const pathwayItems = items.map((item: any, index: number) => ({
        pathway_id: params.id,
        content_id: item.content_id,
        content_type: item.content_type, // 'formation', 'test', 'resource'
        position: index + 1,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await sb
        .from('pathway_items')
        .insert(pathwayItems);

      if (itemsError) {
        console.error('Error inserting pathway items:', itemsError);
        return NextResponse.json({ error: 'Failed to update pathway items' }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in pathway items API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
