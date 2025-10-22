// app/(dashboard)/admin/page.tsx - Dispatcher vers page de choix d'organisation
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminIndex() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  const { data } = await sb
    .from('org_memberships')
    .select('organizations!inner(slug,name)')
    .eq('user_id', user.id);

  const orgs = (data || []).map((r: any) => r.organizations);
  if (orgs.length === 0) return <div className="p-6 text-neutral-300">Aucune organisation associée.</div>;
  
  // Toujours rediriger vers la page de choix pour un flux cohérent
  redirect('/admin/select-org');
}