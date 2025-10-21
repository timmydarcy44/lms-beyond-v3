// app/(dashboard)/admin/[org]/parcours/new/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function NewParcoursPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  // Vérifier l'organisation
  const { data: organization } = await sb
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single();

  if (!organization) {
    redirect('/admin');
  }

  // Vérifier le membership
  const { data: membership } = await sb
    .from('org_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', organization.id)
    .single();

  if (!membership) {
    redirect('/admin');
  }

  // Rediriger vers la page de création générale avec contexte d'organisation
  redirect(`/admin/parcours/new?org=${orgSlug}`);
}
