import { supabaseServer } from '@/lib/supabase/server';

export type OrgLite = { id: string; slug: string; name: string };

export async function getSessionUser() {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user ?? null;
}

export async function getOrgsForUser(userId: string): Promise<OrgLite[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('user_organizations')
    .select('organizations:org_id(id,slug,name)')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => r.organizations).filter(Boolean);
}

export async function getOrgBySlug(slug: string): Promise<OrgLite | null> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('organizations')
    .select('id,slug,name')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function requireOrgAccess(userId: string, orgId: string, roles?: string[]) {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('user_organizations')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('FORBIDDEN');
  if (roles && !roles.includes(data.role)) throw new Error('FORBIDDEN');
  return true;
}
