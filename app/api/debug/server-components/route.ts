// app/api/debug/server-components/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getUserOrganizations, resolveOrgFromSlugOrThrow } from '@/lib/org-server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug Server Components - Starting...');
    
    const sb = await supabaseServer();
    const { data: { user }, error: userError } = await sb.auth.getUser();
    
    if (userError) {
      console.error('❌ User auth error:', userError);
      return NextResponse.json({ 
        error: 'Authentication error',
        details: userError.message,
        step: 'auth'
      }, { status: 401 });
    }
    
    if (!user) {
      console.log('⚠️ No user found');
      return NextResponse.json({ 
        error: 'No user found',
        step: 'auth'
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    // Test 1: getUserOrganizations
    let organizations;
    try {
      console.log('🔄 Testing getUserOrganizations...');
      organizations = await getUserOrganizations();
      console.log('✅ Organizations fetched:', organizations.length);
    } catch (error) {
      console.error('❌ getUserOrganizations error:', error);
      return NextResponse.json({ 
        error: 'getUserOrganizations failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'getUserOrganizations',
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }

    // Test 2: resolveOrgFromSlugOrThrow for each org
    const orgTests = [];
    for (const org of organizations) {
      try {
        console.log(`🔄 Testing resolveOrgFromSlugOrThrow for ${org.slug}...`);
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
        console.log(`✅ ${org.slug} resolved successfully`);
      } catch (error) {
        console.error(`❌ resolveOrgFromSlugOrThrow error for ${org.slug}:`, error);
        orgTests.push({
          slug: org.slug,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    // Test 3: Direct database queries
    let directOrgs, directMemberships;
    try {
      console.log('🔄 Testing direct database queries...');
      
      const { data: orgs, error: orgsError } = await sb
        .from('organizations')
        .select('id, slug, name, cover_url')
        .limit(10);
      
      if (orgsError) {
        console.error('❌ Direct orgs query error:', orgsError);
        directOrgs = { error: orgsError.message };
      } else {
        console.log('✅ Direct orgs query successful:', orgs?.length || 0);
        directOrgs = orgs;
      }

      const { data: memberships, error: membershipsError } = await sb
        .from('org_memberships')
        .select(`
          id, role, user_id, org_id,
          organizations!inner(id, slug, name, cover_url)
        `)
        .eq('user_id', user.id);

      if (membershipsError) {
        console.error('❌ Direct memberships query error:', membershipsError);
        directMemberships = { error: membershipsError.message };
      } else {
        console.log('✅ Direct memberships query successful:', memberships?.length || 0);
        directMemberships = memberships;
      }
    } catch (error) {
      console.error('❌ Direct queries error:', error);
      return NextResponse.json({ 
        error: 'Direct database queries failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'directQueries',
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
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
      directQueries: {
        organizations: directOrgs,
        memberships: directMemberships
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 Debug Server Components - Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error in debug',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      step: 'unexpected'
    }, { status: 500 });
  }
}
