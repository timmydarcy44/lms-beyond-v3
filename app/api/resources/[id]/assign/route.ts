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
    const { target_type, target_id } = body;

    if (!target_type || !target_id) {
      return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 });
    }

    if (!['learner', 'group'].includes(target_type)) {
      return NextResponse.json({ error: 'target_type must be learner or group' }, { status: 400 });
    }

    // Vérifier que la ressource appartient à l'org
    const { data: resource, error: resourceError } = await sb
      .from('resources')
      .select('id')
      .eq('id', params.id)
      .eq('org_id', org.id)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Vérifier que la cible existe dans l'org
    if (target_type === 'learner') {
      const { data: learner, error: learnerError } = await sb
        .from('org_memberships')
        .select('user_id')
        .eq('user_id', target_id)
        .eq('org_id', org.id)
        .eq('role', 'learner')
        .single();

      if (learnerError || !learner) {
        return NextResponse.json({ error: 'Learner not found in organization' }, { status: 404 });
      }
    }

    // Assigner la ressource (idempotent)
    const { error: assignError } = await sb
      .from('resource_assignments')
      .upsert({
        resource_id: params.id,
        target_type,
        target_id,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'resource_id,target_type,target_id'
      });

    if (assignError) {
      console.error('Error assigning resource:', assignError);
      return NextResponse.json({ error: 'Failed to assign resource' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in resource assign API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
