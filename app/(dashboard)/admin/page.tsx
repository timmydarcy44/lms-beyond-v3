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
    .select('organizations!inner(slug)')
    .eq('user_id', user.id);

  const slugs = (data || []).map((r: any) => r.organizations.slug);
  if (slugs.length === 0) return <div className="p-6 text-neutral-300">Aucune organisation.</div>;
  if (slugs.length === 1) redirect(`/admin/${slugs[0]}/formations`);
  redirect('/admin/select-org');
}