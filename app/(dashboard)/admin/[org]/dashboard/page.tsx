// app/(dashboard)/admin/[org]/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { resolveOrgFromSlugOrThrow } from '@/lib/org-server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  
  try {
    // Valider l'organisation et récupérer le contexte
    const { orgId, slug, orgName } = await resolveOrgFromSlugOrThrow(orgSlug);
    
    const sb = await supabaseServer();
    
    // Récupérer quelques statistiques pour le dashboard
    const { data: formations } = await sb
      .from('formations')
      .select('id, title, published, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: members } = await sb
      .from('org_memberships')
      .select('id, role, users!inner(email)')
      .eq('org_id', orgId)
      .limit(5);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Dashboard - {orgName}
          </h1>
          <p className="text-neutral-400">Vue d'ensemble de votre organisation</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Formations</h3>
            <p className="text-3xl font-bold text-blue-400">{formations?.length || 0}</p>
            <p className="text-sm text-neutral-400">Total créées</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Membres</h3>
            <p className="text-3xl font-bold text-green-400">{members?.length || 0}</p>
            <p className="text-sm text-neutral-400">Dans l'organisation</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Publiées</h3>
            <p className="text-3xl font-bold text-purple-400">
              {formations?.filter(f => f.published).length || 0}
            </p>
            <p className="text-sm text-neutral-400">Formations actives</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href={`/admin/${slug}/formations/new`}
              className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 text-center font-medium"
            >
              Nouvelle formation
            </a>
            <a
              href={`/admin/${slug}/formations`}
              className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 text-center font-medium"
            >
              Gérer formations
            </a>
            <a
              href={`/admin/${slug}/utilisateurs`}
              className="p-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all duration-200 text-center font-medium"
            >
              Utilisateurs
            </a>
            <a
              href={`/admin/${slug}/settings`}
              className="p-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg transition-all duration-200 text-center font-medium"
            >
              Paramètres
            </a>
          </div>
        </div>

        {/* Recent Formations */}
        {formations && formations.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Formations récentes</h3>
            <div className="space-y-3">
              {formations.map((formation: any) => (
                <div key={formation.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">{formation.title}</h4>
                    <p className="text-sm text-neutral-400">
                      Créée le {new Date(formation.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      formation.published 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {formation.published ? 'Publiée' : 'Brouillon'}
                    </span>
                    <a
                      href={`/admin/${slug}/formations/${formation.id}`}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Modifier
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in dashboard page:', error);
    // Si erreur (UNAUTH, ORG_NOT_FOUND, FORBIDDEN), rediriger vers /admin
    redirect('/admin');
  }
}