// app/(dashboard)/admin/page.tsx - Dispatcher vers 1 org ou picker
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
  if (orgs.length === 1) redirect(`/admin/${orgs[0].slug}/formations`);
  redirect('/admin/select-org');
}