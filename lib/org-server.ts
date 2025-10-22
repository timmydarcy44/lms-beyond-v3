// lib/org-server.ts - Server-only helper for organization resolution
import { supabaseServer } from '@/lib/supabase/server';

export type OrgContext = {
  orgId: string;
  slug: string;
  orgName: string;
  userId: string;
  role: string;
};

/**
 * Resolves organization from slug and validates user membership
 * Throws errors for authentication, organization not found, or forbidden access
 */
export async function resolveOrgFromSlugOrThrow(slug: string): Promise<OrgContext> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('UNAUTH');

  const { data: org, error: orgErr } = await sb
    .from('organizations')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();
  
  if (orgErr || !org) throw new Error('ORG_NOT_FOUND');

  const { data: mem, error: memErr } = await sb
    .from('org_memberships')
    .select('role')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (memErr || !mem) throw new Error('FORBIDDEN');

  return { 
    orgId: org.id, 
    slug: org.slug, 
    orgName: org.name, 
    userId: user.id, 
    role: mem.role 
  };
}

/**
 * Gets all organizations for the current user
 */
export async function getUserOrganizations(): Promise<Array<{ id: string; slug: string; name: string; cover_url?: string }>> {
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('UNAUTH');

    const { data, error } = await sb
      .from('org_memberships')
      .select(`
        organizations!inner(
          id,
          slug,
          name,
          cover_url
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching organizations:', error);
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }

    return data?.map((m: any) => m.organizations) || [];
  } catch (error) {
    console.error('getUserOrganizations error:', error);
    throw error;
  }
}
