import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getOrgBySlug, getSessionUser, requireOrgAccess } from '@/lib/orgs';

export const dynamic = 'force-dynamic';

export default async function FormationsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login/admin');

  const orgRow = await getOrgBySlug(org);
  if (!orgRow) redirect('/choice');
  await requireOrgAccess(user.id, orgRow.id);

  const sb = await supabaseServer();
  const { data: formations } = await sb
    .from('formations')
    .select('id,title,updated_at')
    .eq('org_id', orgRow.id)
    .order('updated_at', { ascending: false });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Formations</h2>
        {/* le bouton créera plus tard (server action) */}
        <button
          className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          disabled
          title="Arrive bientôt"
        >
          + Nouvelle formation
        </button>
      </div>

      <ul className="space-y-2">
        {(formations ?? []).map((f) => (
          <li key={f.id}>
            <a
              href={`/admin/${org}/formations/${f.id}`}
              className="block rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10"
            >
              <div className="text-sm font-medium">{f.title}</div>
              <div className="text-xs text-neutral-400">
                {f.updated_at ? new Date(f.updated_at).toLocaleString() : '—'}
              </div>
            </a>
          </li>
        ))}
        {(!formations || formations.length === 0) && (
          <li className="rounded-lg border border-dashed border-white/10 p-6 text-neutral-400">
            Aucune formation pour le moment.
          </li>
        )}
      </ul>
    </>
  );
}
