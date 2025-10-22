import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSingleOrg } from '@/lib/org-single';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    redirect('/login/admin');
  }

  try {
    // Utiliser le helper mono-org pour obtenir l'organisation unique
    const org = await getSingleOrg();
    
    // Rediriger vers les formations de l'organisation unique
    redirect('/admin/formations');
  } catch (error) {
    console.error('[admin/dashboard] Error getting single org:', error);
    
    // Fallback : charger les organisations de l'utilisateur
    const { data, error: membershipsError } = await sb
      .from('org_memberships')
      .select('organizations!inner(slug,name)')
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('[admin/dashboard] memberships error', membershipsError);
      redirect('/login/admin');
    }

    const orgs = (data || []).map((r: any) => r.organizations);
    
    if (orgs.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl font-semibold mb-4">Aucune organisation</h1>
            <p className="text-white/70">Aucune organisation associée à votre compte.</p>
          </div>
        </div>
      );
    }

    if (orgs.length === 1) {
      // Une seule organisation, rediriger vers les formations
      redirect('/admin/formations');
    }

    // Plusieurs organisations, afficher la page de choix
    return (
      <div className="min-h-screen bg-[#252525] text-neutral-100">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-3xl font-semibold mb-8">
            Bonjour <span className="bg-gradient-to-r from-iris-500 to-cyan-400 bg-clip-text text-transparent">
              {user.email?.split('@')[0] || 'Admin'}
            </span>
          </h1>

          <p className="text-neutral-400 mb-6">Choisissez votre organisation :</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {orgs.map((org: any) => (
              <a
                key={org.slug}
                href="/admin/formations"
                className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-elev-2 hover:-translate-y-1 transition-all"
              >
                <div className="aspect-[4/3] grid place-items-center bg-gradient-to-br from-iris-500/15 to-cyan-400/10">
                  <div className="text-lg font-medium opacity-90 group-hover:opacity-100 transition text-center px-4">
                    {org.name}
                  </div>
                </div>
                <div className="px-4 py-3 text-sm text-neutral-300 bg-[#262626] border-t border-white/10">
                  Accéder aux formations
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
