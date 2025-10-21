// lib/org-server.ts - Server-only helper for organization resolution
import { supabaseServer } from '@/lib/supabase/server';

export type OrgContext = {
  orgId: string;
  slug: string;
  role: string;
  userId: string;
};

/**
 * Resolves organization from slug and validates user membership
 * Throws errors for authentication, organization not found, or forbidden access
 */
export async function resolveOrgFromSlugOrThrow(slug: string): Promise<OrgContext> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('UNAUTH');

  const { data, error } = await sb
    .from('organizations')
    .select('id, slug')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  
  if (error || !data) throw new Error('ORG_NOT_FOUND');

  const { data: mem, error: memErr } = await sb
    .from('org_memberships')
    .select('role')
    .eq('org_id', data.id)
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (memErr || !mem) throw new Error('FORBIDDEN');

  return { 
    orgId: data.id, 
    slug: data.slug, 
    role: mem.role, 
    userId: user.id 
  };
}

/**
 * Gets all organizations for the current user
 */
export async function getUserOrganizations(): Promise<Array<{ id: string; slug: string; name: string }>> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('UNAUTH');

  const { data, error } = await sb
    .from('org_memberships')
    .select(`
      organizations!inner(
        id,
        slug,
        name
      )
    `)
    .eq('user_id', user.id);

  if (error) throw new Error('Failed to fetch organizations');

  return data?.map((m: any) => m.organizations) || [];
}

/**
 * Gets the default organization for single-org users
 */
export async function getDefaultOrgSlug(): Promise<string | null> {
  const orgs = await getUserOrganizations();
  return orgs.length === 1 ? orgs[0].slug : null;
}
