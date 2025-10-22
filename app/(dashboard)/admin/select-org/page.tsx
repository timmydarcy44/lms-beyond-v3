// app/(dashboard)/admin/select-org/page.tsx - Netflix-style organization picker
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SelectOrgPage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  const { data } = await sb
    .from('org_memberships')
    .select('organizations!inner(slug,name)')
    .eq('user_id', user.id);

  const orgs = (data || []).map((r: any) => r.organizations);
  if (orgs.length === 0) return <div className="p-6 text-neutral-300">Aucune organisation.</div>;
  if (orgs.length === 1) redirect(`/admin/${orgs[0].slug}/formations`);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#252525] text-neutral-100 p-8">
      <h1 className="text-2xl font-semibold mb-6">Choisissez une organisation</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {orgs.map((o: any) => (
          <Link
            key={o.slug}
            href={`/admin/${o.slug}/formations`}
            className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-elev-2 hover:-translate-y-1 transition-all"
          >
            <div className="aspect-[4/3] grid place-items-center bg-gradient-to-br from-iris-500/15 to-cyan-400/10">
              <div className="text-xl font-semibold opacity-90 group-hover:opacity-100 transition">
                {o.name}
              </div>
            </div>
            <div className="px-4 py-3 text-sm text-neutral-300 bg-[#262626] border-t border-white/10">
              Accéder à {o.slug}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
