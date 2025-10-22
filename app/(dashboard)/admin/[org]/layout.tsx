import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function AdminOrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const sb = await supabaseServer();
  
  // Vérifier que l'utilisateur est connecté
  const { data: { user }, error: authError } = await sb.auth.getUser();
  if (authError || !user) {
    redirect('/login/admin');
  }

  // Vérifier que l'utilisateur a accès à cette organisation
  const { data: membership, error: membershipError } = await sb
    .from('org_memberships')
    .select('role, organizations!inner(slug, name)')
    .eq('user_id', user.id)
    .eq('organizations.slug', orgSlug)
    .single();

  if (membershipError || !membership) {
    redirect('/admin'); // Rediriger vers le dispatcher au lieu de /login/admin
  }

  // Vérifier que l'utilisateur est admin
  if (membership.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {children}
    </div>
  );
}
