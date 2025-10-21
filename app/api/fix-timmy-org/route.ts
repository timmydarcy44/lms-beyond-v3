// app/api/fix-timmy-org/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    console.log('🔧 Fix Timmy Org - User:', user.email);

    // Vérifier si l'utilisateur a déjà une organisation
    const { data: existingMembership } = await sb
      .from('org_memberships')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json({ 
        message: 'Utilisateur déjà associé à une organisation',
        membership: existingMembership
      });
    }

    // Créer une organisation par défaut pour Timmy
    const { data: org, error: orgError } = await sb
      .from('organizations')
      .insert({
        name: 'Organisation Timmy',
        slug: 'timmy-org',
        description: 'Organisation par défaut pour Timmy'
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating org:', orgError);
      return NextResponse.json({ error: 'Erreur création organisation' }, { status: 500 });
    }

    // Ajouter Timmy comme membre admin de cette organisation
    const { data: membership, error: membershipError } = await sb
      .from('org_memberships')
      .insert({
        user_id: user.id,
        org_id: org.id,
        role: 'admin'
      })
      .select()
      .single();

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      return NextResponse.json({ error: 'Erreur création membership' }, { status: 500 });
    }

    // Mettre à jour les formations existantes pour les associer à cette organisation
    const { data: formations, error: formationsError } = await sb
      .from('formations')
      .update({ org_id: org.id })
      .eq('created_by', user.id)
      .is('org_id', null)
      .select();

    return NextResponse.json({
      message: 'Organisation créée et utilisateur associé',
      organization: org,
      membership: membership,
      updatedFormations: formations?.length || 0
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
