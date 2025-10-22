import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getSingleOrg } from '@/lib/org-single';

export default async function FormationBuilderPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  
  if (!user) {
    return <div className="p-6 text-neutral-300">Non connecté</div>;
  }

  // Récupérer l'organisation unique
  const { orgId } = await getSingleOrg();

  // Vérifier que l'utilisateur est admin de cette organisation
  const { data: membership, error: membershipError } = await sb
    .from('org_memberships')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError || !membership || membership.role !== 'admin') {
    return <div className="p-6 text-neutral-300">Accès refusé</div>;
  }

  // Récupérer la formation
  const { data: formation } = await sb
    .from('formations')
    .select('id, org_id, title, status')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();

  if (!formation) notFound();

  // Rediriger vers le builder général
  redirect(`/admin/formations/${formation.id}`);
}