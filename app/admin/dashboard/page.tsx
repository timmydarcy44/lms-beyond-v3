import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSingleOrg } from '@/lib/org-single';
import { logServer, isDiag, toJSONSafe } from '@/lib/debug';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const diag:any = { scope: 'admin/dashboard', phase: 'start' };

  try {
    const sb = await supabaseServer();

    const { data: { user } } = await sb.auth.getUser();
    diag.phase = 'got-user';
    diag.user = user ? { id: user.id, email: user.email } : null;

    if (!user) {
      if (isDiag()) return <DiagView diag={{ ...diag, note: 'UNAUTH' }} />;
      redirect('/login/admin');
    }

    const { orgId } = await getSingleOrg();
    diag.phase = 'got-org';
    diag.orgId = orgId;

    const { data: formations, error } = await sb
      .from('formations')
      .select('id,title,updated_at')
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false });

    if (error) {
      diag.phase = 'query-error';
      diag.error = error.message;
      logServer('admin/dashboard', diag);
      return <DiagView diag={diag} />;
    }

    diag.phase = 'render-ok';
    diag.count = formations?.length ?? 0;

    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
        <ul className="space-y-1">
          {(formations ?? []).map(f => <li key={f.id}>{f.title}</li>)}
          {(!formations || formations.length === 0) && <li>Aucune formation</li>}
        </ul>

        {isDiag() && (
          <details className="mt-6">
            <summary className="cursor-pointer">Diag</summary>
            <pre className="text-xs whitespace-pre-wrap bg-black/40 border border-white/10 rounded p-4">
              {JSON.stringify(toJSONSafe(diag), null, 2)}
            </pre>
          </details>
        )}
      </main>
    );
  } catch (e:any) {
    diag.phase = 'caught';
    diag.caught = e?.message ?? String(e);
    logServer('admin/dashboard-caught', diag);
    return <DiagView diag={diag} />;
  }
}

function DiagView({ diag }: { diag: any }) {
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="max-w-xl w-full">
        <h1 className="text-xl font-semibold mb-2">Dashboard (mode sûr)</h1>
        <p className="text-sm opacity-80 mb-4">
          Un problème empêche le rendu complet. Les détails ci-dessous aident au diagnostic.
        </p>
        <pre className="text-xs whitespace-pre-wrap bg-black/40 border border-white/10 rounded p-4">
          {JSON.stringify(diag, null, 2)}
        </pre>
      </div>
    </main>
  );
}