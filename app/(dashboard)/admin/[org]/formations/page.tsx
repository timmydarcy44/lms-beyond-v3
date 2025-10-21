import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Plus, Search, GraduationCap, Edit, Eye } from 'lucide-react';
import Link from 'next/link';

export default async function AdminFormationsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  // Récupérer l'organisation par le slug
  const { data: organization } = await sb
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single();

  if (!organization) {
    redirect('/admin');
  }

  // Vérifier que l'utilisateur est membre de cette organisation
  const { data: membership } = await sb
    .from('org_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', organization.id)
    .single();

  if (!membership) {
    redirect('/admin');
  }

  // Récupérer les formations de cette organisation
  const { data: formations, error } = await sb
    .from('formations')
    .select('id, title, cover_url, visibility_mode, published, updated_at, org_id, theme')
    .eq('org_id', organization.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching formations:', error);
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Formations - {organization.name}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">Gérez les formations de votre organisation</p>
        </div>
        <Link href={`/admin/${orgSlug}/formations/new`} className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base flex items-center gap-2">
          <Plus size={16} />
          Nouvelle formation
        </Link>
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher une formation..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="flex gap-3 sm:gap-4">
          <select className="flex-1 sm:flex-none px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm">
            <option value="">Toutes les formations</option>
            <option value="published">Publiées</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>
      </div>

      {/* Grid des formations */}
      {!formations || formations.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap size={48} className="mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucune formation</h3>
          <p className="text-neutral-400 mb-6">Créez votre première formation pour commencer.</p>
          <Link
            href={`/admin/${orgSlug}/formations/new`}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 font-medium"
          >
            Créer une formation
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {formations.map((formation: any) => (
            <div key={formation.id} className="group glass rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative">
              {/* Image de couverture */}
              <div className="aspect-video bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center relative overflow-hidden">
                {formation.cover_url ? (
                  <img 
                    src={formation.cover_url} 
                    alt={formation.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-white/50 text-sm">Image de couverture</div>
                )}
              </div>

              {/* Contenu de la carte */}
              <div className="p-3 sm:p-4">
                {/* Badge de statut */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    formation.published 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {formation.published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>

                {/* Titre */}
                <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors text-sm sm:text-base">
                  {formation.title}
                </h3>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/${orgSlug}/formations/${formation.id}`}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xs sm:text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-center"
                    >
                      <Edit className="h-3 w-3 inline mr-1" />
                      Modifier
                    </Link>
                    
                    <Link
                      href={`/admin/${orgSlug}/formations/${formation.id}/preview`}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs sm:text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-center"
                    >
                      <Eye className="h-3 w-3 inline mr-1" />
                      Prévisualiser
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
