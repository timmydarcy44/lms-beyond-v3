// app/api/debug/org-system/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getUserOrganizations, resolveOrgFromSlugOrThrow } from '@/lib/org-server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const { data: { user }, error: userError } = await sb.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Non authentifié',
        userError: userError?.message 
      }, { status: 401 });
    }

    console.log('🔍 Debug Org System - User:', user.email);

    // Test 1: Récupérer les organisations
    let organizations;
    try {
      organizations = await getUserOrganizations();
      console.log('✅ Organizations fetched:', organizations.length);
    } catch (error) {
      console.error('❌ Error fetching organizations:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch organizations',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Test 2: Tester la résolution d'organisation pour chaque org
    const orgTests = [];
    for (const org of organizations) {
      try {
        const resolved = await resolveOrgFromSlugOrThrow(org.slug);
        orgTests.push({
          slug: org.slug,
          success: true,
          resolved: {
            orgId: resolved.orgId,
            orgName: resolved.orgName,
            role: resolved.role
          }
        });
      } catch (error) {
        orgTests.push({
          slug: org.slug,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 3: Vérifier les membres d'organisation
    const { data: memberships, error: membershipsError } = await sb
      .from('org_memberships')
      .select(`
        *,
        organizations!inner(
          id,
          slug,
          name,
          cover_url
        )
      `)
      .eq('user_id', user.id);

    // Test 4: Vérifier les formations existantes
    const { data: formations, error: formationsError } = await sb
      .from('formations')
      .select('id, title, org_id, created_by')
      .eq('created_by', user.id)
      .limit(5);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      organizations: {
        count: organizations.length,
        data: organizations
      },
      orgResolutionTests: orgTests,
      memberships: {
        data: memberships,
        error: membershipsError
      },
      formations: {
        data: formations,
        error: formationsError
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 Debug Org System Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
