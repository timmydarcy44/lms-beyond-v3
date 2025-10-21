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
    const { learners, groups, pathways } = body;

    // Vérifier que la formation appartient à l'org
    const { data: formation, error: formationError } = await sb
      .from('formations')
      .select('id')
      .eq('id', params.id)
      .eq('org_id', org.id)
      .single();

    if (formationError || !formation) {
      return NextResponse.json({ error: 'Formation not found' }, { status: 404 });
    }

    // Assigner aux apprenants
    if (learners && learners.length > 0) {
      const learnerAssignments = learners.map((learnerId: string) => ({
        formation_id: params.id,
        target_type: 'learner',
        target_id: learnerId,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      }));

      const { error: learnerError } = await admin
        .from('formation_assignments')
        .upsert(learnerAssignments, {
          onConflict: 'formation_id,target_type,target_id'
        });

      if (learnerError) {
        console.error('Error assigning to learners:', learnerError);
        return NextResponse.json({ error: 'Failed to assign to learners' }, { status: 500 });
      }
    }

    // Assigner aux groupes
    if (groups && groups.length > 0) {
      const groupAssignments = groups.map((groupId: string) => ({
        formation_id: params.id,
        target_type: 'group',
        target_id: groupId,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      }));

      const { error: groupError } = await admin
        .from('formation_assignments')
        .upsert(groupAssignments, {
          onConflict: 'formation_id,target_type,target_id'
        });

      if (groupError) {
        console.error('Error assigning to groups:', groupError);
        return NextResponse.json({ error: 'Failed to assign to groups' }, { status: 500 });
      }
    }

    // Ajouter aux parcours
    if (pathways && pathways.length > 0) {
      for (const pathwayId of pathways) {
        // Vérifier que le parcours appartient à l'org
        const { data: pathway, error: pathwayError } = await sb
          .from('pathways')
          .select('id')
          .eq('id', pathwayId)
          .eq('org_id', org.id)
          .single();

        if (pathwayError || !pathway) {
          console.warn(`Pathway ${pathwayId} not found in org`);
          continue;
        }

        // Ajouter la formation au parcours
        const { error: pathwayItemError } = await admin
          .from('pathway_items')
          .upsert({
            pathway_id: pathwayId,
            content_id: params.id,
            content_type: 'formation',
            position: 1, // Position par défaut
            created_at: new Date().toISOString()
          }, {
            onConflict: 'pathway_id,content_id,content_type'
          });

        if (pathwayItemError) {
          console.error('Error adding formation to pathway:', pathwayItemError);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in formation assign API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
