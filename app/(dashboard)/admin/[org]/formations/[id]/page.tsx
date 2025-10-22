import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

async function resolveOrgFromSlugOrThrow(slug: string) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('UNAUTH');

  const { data: org } = await sb.from('organizations').select('id,slug').eq('slug', slug).maybeSingle();
  if (!org) throw new Error('ORG_NOT_FOUND');

  const { data: mem } = await sb.from('org_memberships').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!mem) throw new Error('FORBIDDEN');

  return { orgId: org.id, userId: user.id, role: mem.role };
}

export default async function BuilderPage({ 
  params 
}: { 
  params: Promise<{ org: string; id: string }> 
}) {
  const { org, id } = await params;
  const ctx = await resolveOrgFromSlugOrThrow(org);
  const sb = await supabaseServer();

  const { data: formation } = await sb
    .from('formations')
    .select('id, org_id, title, status')
    .eq('org_id', ctx.orgId)
    .eq('id', id)
    .maybeSingle();

  if (!formation) notFound();

  // Rediriger vers le builder général avec contexte d'organisation
  redirect(`/admin/formations/${formation.id}?org=${org}`);
}
