import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getSingleOrg } from '@/lib/org-single';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  const { orgId } = await getSingleOrg();

  const { data: formations, error } = await sb
    .from('formations')
    .select('id,title,updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <ul className="space-y-1">
        {(formations ?? []).map(f => <li key={f.id}>{f.title}</li>)}
        {(!formations || formations.length === 0) && <li>Aucune formation</li>}
      </ul>
    </main>
  );
}
