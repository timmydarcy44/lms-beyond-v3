import { supabaseServer } from '@/lib/supabase/server';
import { getSingleOrg } from '@/lib/org-single';
export const dynamic = 'force-dynamic';

export default async function TestPage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { id: orgId, slug } = await getSingleOrg();
  return (
    <main className="p-6">
      <h1>Diagnostic Supabase</h1>
      <p><strong>User :</strong> {user?.id ?? 'aucun'}</p>
      <p><strong>Organisation :</strong> {orgId}</p>
      <p><strong>Slug :</strong> {slug}</p>
    </main>
  );
}
