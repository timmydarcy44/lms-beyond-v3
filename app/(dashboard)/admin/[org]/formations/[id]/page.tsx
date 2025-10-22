import { notFound, redirect } from 'next/navigation';
import { resolveOrgFromSlugOrThrow } from '@/lib/org-server';
import { supabaseServer } from '@/lib/supabase/server';

export default async function FormationBuilderPage({ 
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
    .eq('id', id)
    .eq('org_id', ctx.orgId)
    .maybeSingle();

  if (!formation) notFound();

  // Rediriger vers le builder général avec contexte d'organisation
  redirect(`/admin/formations/${formation.id}?org=${org}`);
}
