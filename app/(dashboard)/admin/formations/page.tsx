export const dynamic = 'force-dynamic'; export const revalidate = 0;

import { supabaseServer } from '@/lib/supabase/server';
import FormationCard from '@/components/admin/FormationCard';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default async function FormationsPage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  // NE PAS filtrer par org_id tant que le contexte d'org n'est pas fiable
  const { data, error } = await sb
    .from('formations')
    .select('id, title, cover_url, visibility_mode, published, updated_at, org_id, theme')
    .order('updated_at', { ascending: false });

  if (error) {
    // Affiche l'erreur vraie pour debug
    return (
      <div className="space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-iris-grad">Formations</h2>
        </div>
        <pre className="text-red-400 text-xs whitespace-pre-wrap bg-black/20 p-4 rounded">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-iris-grad">Formations</h2>
          <Link href="/admin/formations/new" className="btn-cta-lg">Créer une formation</Link>
        </div>
        <div className="opacity-70">Aucune formation trouvée.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Formations</h2>
          <p className="text-xs sm:text-sm text-neutral-400">Toutes mes formations (créées par moi et celles de mes organisations)</p>
        </div>
        <Link href="/admin/formations/new" className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base">Créer une formation</Link>
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
            <option value="">Toutes les visibilités</option>
            <option value="public">Public</option>
            <option value="catalog_only">Catalogue uniquement</option>
            <option value="private">Privé</option>
          </select>

          <select className="flex-1 sm:flex-none px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm">
            <option value="">Tous les statuts</option>
            <option value="published">Publié</option>
            <option value="draft">Brouillon</option>
          </select>
        </div>
      </div>

      {/* Grid des formations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {data.map((formation) => (
          <FormationCard key={formation.id} formation={formation} />
        ))}
      </div>
    </div>
  );
}