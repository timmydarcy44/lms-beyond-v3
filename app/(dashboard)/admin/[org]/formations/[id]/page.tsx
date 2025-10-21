// app/(dashboard)/admin/[org]/formations/[id]/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function FormationBuilderPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org: orgSlug, id } = await params;
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  // Vérifier l'organisation
  const { data: organization, error: orgError } = await sb
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single();

  if (orgError || !organization) {
    console.error('Error fetching organization:', orgError);
    redirect('/admin');
  }

  // Vérifier le membership
  const { data: membership, error: membershipError } = await sb
    .from('org_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', organization.id)
    .single();

  if (membershipError || !membership) {
    console.error('Error fetching membership:', membershipError);
    redirect('/admin');
  }

  // Vérifier que la formation appartient à cette organisation
  const { data: formation, error: formationError } = await sb
    .from('formations')
    .select('id, title, org_id')
    .eq('id', id)
    .eq('org_id', organization.id)
    .single();

  if (formationError || !formation) {
    console.error('Error fetching formation:', formationError);
    redirect(`/admin/${orgSlug}/formations`);
  }

  // Rediriger vers le builder général avec contexte d'organisation
  redirect(`/admin/formations/${id}?org=${orgSlug}`);
}
