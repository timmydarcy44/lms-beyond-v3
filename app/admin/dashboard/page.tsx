import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSingleOrg } from '@/lib/org-single';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const sb = await supabaseServer(); // ✅ await obligatoire
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  const { id: orgId } = await getSingleOrg();
  // exemple: charger des données org-scopées
  const { data: formations } = await sb
    .from('formations')
    .select('id,title,updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      {/* render formations… */}
    </main>
  );
}
