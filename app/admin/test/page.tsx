import { supabaseServer } from '@/lib/supabase/server';
import { getSingleOrg } from '@/lib/org-single';

export const dynamic = 'force-dynamic';

export default async function TestPage() {
  const sb = await supabaseServer();

  const { data: { user } } = await sb.auth.getUser();
  const { id: orgId, slug } = await getSingleOrg();

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">🔍 Diagnostic</h1>
      <p><strong>User ID:</strong> {user?.id || 'Aucun utilisateur connecté'}</p>
      <p><strong>Organisation ID:</strong> {orgId}</p>
      <p><strong>Slug:</strong> {slug}</p>
      <p className="text-sm text-gray-400 mt-4">
        Variables d'environnement :<br />
        SINGLE_ORG_SLUG = {process.env.SINGLE_ORG_SLUG}<br />
        SINGLE_ORG_ID = {process.env.SINGLE_ORG_ID}
      </p>
    </main>
  );
}
