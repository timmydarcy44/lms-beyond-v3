// app/(dashboard)/admin/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function AdminIndex() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  // Récupérer toutes les organisations de l'utilisateur
  const { data: memberships } = await sb
    .from('org_memberships')
    .select(`
      organizations!inner(
        id,
        name,
        slug,
        description
      )
    `)
    .eq('user_id', user.id);

  if (!memberships || memberships.length === 0) {
    redirect('/login/admin');
  }

  // Toujours rediriger vers la première organisation
  const org = memberships[0].organizations as any;
  redirect(`/admin/${org.slug}/formations`);
}