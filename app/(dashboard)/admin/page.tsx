import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function AdminIndex() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  const { data } = await sb
    .from('org_memberships')
    .select('organizations!inner(slug,name)')
    .eq('user_id', user.id);

  const orgs = (data || []).map((r: any) => r.organizations);
  if (orgs.length === 0) return <div className="min-h-screen grid place-items-center text-neutral-300">Aucune organisation associée.</div>;
  if (orgs.length === 1) redirect(`/admin/${orgs[0].slug}/dashboard`);
  redirect('/admin/choice');
}