import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function AdminIndex() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  const { data, error } = await sb
    .from('org_memberships')
    .select('organizations!inner(slug,name)')
    .eq('user_id', user.id);

  if (error) {
    console.error('[admin/page] memberships error', error);
    redirect('/login/admin');
  }

  const orgs = (data || []).map((r: any) => r.organizations);
  if (orgs.length === 0) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-neutral-300">
        Aucune organisation associée à votre compte.
      </div>
    );
  }
  if (orgs.length === 1) redirect(`/admin/${orgs[0].slug}/dashboard`);
  // multi-org → vers la page choice SANS layout dashboard
  redirect(`/admin/choice`);
}