import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getOrgBySlug, getSessionUser, requireOrgAccess } from '@/lib/orgs';

export const dynamic = 'force-dynamic';

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login/admin');

  const orgRow = await getOrgBySlug(org);
  if (!orgRow) notFound();
  await requireOrgAccess(user.id, orgRow.id);

  const sb = await supabaseServer();
  const { data: formations } = await sb
    .from('formations')
    .select('id,title,cover_url,updated_at')
    .eq('org_id', orgRow.id)
    .order('updated_at', { ascending: false });

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold">Dashboard — {orgRow.name}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(formations ?? []).map((f) => (
          <a
            key={f.id}
            href={`/admin/${org}/formations/${f.id}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            <div className="aspect-video bg-black/30">
              {f.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                  Pas de cover
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="line-clamp-2 text-sm font-medium text-white">{f.title}</div>
              <div className="mt-1 text-xs text-neutral-400">
                {f.updated_at ? new Date(f.updated_at).toLocaleDateString() : '—'}
              </div>
            </div>
          </a>
        ))}

        {(!formations || formations.length === 0) && (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-neutral-400">
            Aucune formation pour le moment.
          </div>
        )}
      </div>
    </>
  );
}
