import { supabaseServer } from '@/lib/supabase/server';
import { getSingleOrg } from '@/lib/org-single'; // si tu es repassé en mono-org; sinon remplace par ton helper courant
import { isDiag, logServer, toJSONSafe } from '@/lib/debug';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  const diag: any = { step: 'start' };
  try {
    const sb = await supabaseServer();

    const u = await sb.auth.getUser();
    diag.step = 'got-user';
    diag.user = !!u.data.user ? { id: u.data.user.id, email: u.data.user.email } : null;

    // Essaie de résoudre l'org en mono-org (adapte si multi-org)
    try {
      const org = await getSingleOrg();
      diag.step = 'got-org';
      diag.org = org;
      // ping simple
      const { data, error } = await sb.from('formations').select('id').eq('org_id', org.orgId).limit(1);
      diag.step = 'query-1';
      diag.queryOk = !error;
      if (error) diag.queryError = error.message;
      else diag.sample = toJSONSafe(data);
    } catch (e:any) {
      diag.orgError = e?.message ?? String(e);
    }

    logServer('debug/page', diag);
  } catch (e:any) {
    diag.caught = e?.message ?? String(e);
    logServer('debug/page-error', diag);
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Debug</h1>
      {!isDiag() && (
        <p className="text-sm mb-4">
          Active <code>DIAG=1</code> dans les variables d'environnement pour plus de détails dans les logs.
        </p>
      )}
      <pre className="text-xs whitespace-pre-wrap bg-black/40 border border-white/10 rounded p-4">
        {JSON.stringify(diag, null, 2)}
      </pre>
    </main>
  );
}
