import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSingleOrg } from '@/lib/org-single';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const sb = await supabaseServer(); // ✅ ajout du await
  const { data: { user } } = await sb.auth.getUser();

  if (!user) redirect('/login/admin');

  const { id: orgId } = await getSingleOrg();
  const { data: formations } = await sb
    .from('formations')
    .select('id,title,updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <ul className="space-y-1">
        {formations?.map(f => (
          <li key={f.id} className="text-gray-300">{f.title}</li>
        )) ?? <p>Aucune formation</p>}
      </ul>
    </main>
  );
}
