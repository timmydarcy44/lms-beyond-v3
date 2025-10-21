import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, User, Eye, Download } from 'lucide-react';
import Link from 'next/link';

interface FormationPreviewProps {
  params: Promise<{ id: string }>;
}

export default async function FormationPreviewPage({ params }: FormationPreviewProps) {
  const { id } = await params;
  const sb = await supabaseServer();
  
  // Vérifier l'authentification
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    redirect('/login/admin');
  }

  // Récupérer l'organisation de l'utilisateur
  const { data: userOrg } = await sb
    .from('org_memberships')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!userOrg) {
    return (
      <div className="min-h-screen bg-[#252525] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-neutral-400 mb-6">Aucune organisation associée à votre compte.</p>
          <Link
            href="/admin/formations"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 font-medium"
          >
            Retour aux formations
          </Link>
        </div>
      </div>
    );
  }
  
  // Récupérer les données de la formation avec vérification d'organisation
  const { data: formation, error } = await sb
    .from('formations')
    .select(`
      *,
      sections:sections(id, title, position),
      chapters:chapters(id, section_id, title, position),
      subchapters:subchapters(id, chapter_id, title, position)
    `)
    .eq('id', id)
    .eq('org_id', userOrg.org_id)
    .single();

  if (error || !formation) {
    console.error('Error fetching formation:', error);
    return (
      <div className="min-h-screen bg-[#252525] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Formation non trouvée</h1>
          <p className="text-neutral-400 mb-6">Cette formation n'existe pas ou vous n'avez pas les permissions pour la voir.</p>
          <Link
            href="/admin/formations"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 font-medium"
          >
            Retour aux formations
          </Link>
        </div>
      </div>
    );
  }

  // Organiser la structure
  const sections = formation.sections?.sort((a: any, b: any) => a.position - b.position) || [];
  const chapters = formation.chapters?.sort((a: any, b: any) => a.position - b.position) || [];
  const subchapters = formation.subchapters?.sort((a: any, b: any) => a.position - b.position) || [];

  const getThemeColor = (theme: string) => {
    const themes: Record<string, string> = {
      business: 'from-blue-500 to-blue-600',
      marketing: 'from-orange-500 to-orange-600',
      negociation: 'from-green-500 to-green-600',
      management: 'from-purple-500 to-purple-600',
      rh: 'from-pink-500 to-pink-600',
      vente: 'from-red-500 to-red-600',
      iris: 'from-indigo-500 to-purple-500',
      blush: 'from-rose-500 to-pink-500',
    };
    return themes[theme] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      {/* Header avec navigation */}
      <div className="sticky top-0 z-10 bg-[#252525]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/formations"
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                Retour aux formations
              </Link>
              <div className="h-6 w-px bg-white/20"></div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span>Formations</span>
                <span>/</span>
                <span className="text-white">{formation.title}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/formations/${id}`}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 font-medium"
              >
                Modifier
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <div className="relative">
              {formation.cover_url ? (
                <div className="aspect-video rounded-2xl overflow-hidden">
                  <img
                    src={formation.cover_url}
                    alt={formation.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Eye size={48} className="mx-auto text-white/50 mb-4" />
                    <p className="text-white/50">Aperçu de la formation</p>
                  </div>
                </div>
              )}
              
              {/* Badge thème */}
              {formation.theme && (
                <div className={`absolute top-4 left-4 px-3 py-1 bg-gradient-to-r ${getThemeColor(formation.theme)} text-white rounded-lg text-sm font-medium`}>
                  {formation.theme}
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-4">{formation.title}</h1>
                {formation.description && (
                  <p className="text-neutral-300 text-lg leading-relaxed">{formation.description}</p>
                )}
              </div>

              {/* Métadonnées */}
              <div className="flex flex-wrap gap-6 text-sm text-neutral-400">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Créé le {new Date(formation.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Modifié le {new Date(formation.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span>{sections.length} section(s), {chapters.length} chapitre(s)</span>
                </div>
              </div>
            </div>

            {/* Structure de la formation */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Structure de la formation</h2>
              
              {sections.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <p>Aucune section créée pour le moment</p>
                  <Link
                    href={`/admin/formations/${id}`}
                    className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 font-medium"
                  >
                    Commencer l'édition
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section: any) => {
                    const sectionChapters = chapters.filter((c: any) => c.section_id === section.id);
                    return (
                      <div key={section.id} className="border border-white/10 rounded-xl p-4">
                        <h3 className="font-semibold text-white mb-3">{section.title}</h3>
                        <div className="space-y-2 ml-4">
                          {sectionChapters.map((chapter: any) => {
                            const chapterSubchapters = subchapters.filter((sc: any) => sc.chapter_id === chapter.id);
                            return (
                              <div key={chapter.id} className="border-l-2 border-white/10 pl-4">
                                <h4 className="text-neutral-300 font-medium">{chapter.title}</h4>
                                {chapterSubchapters.length > 0 && (
                                  <div className="mt-2 space-y-1 ml-4">
                                    {chapterSubchapters.map((subchapter: any) => (
                                      <div key={subchapter.id} className="text-neutral-400 text-sm">
                                        • {subchapter.title}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statut */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold text-white mb-4">Statut</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Publication</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    formation.published 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {formation.published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Visibilité</span>
                  <span className="text-white text-sm">
                    {formation.visibility_mode === 'public' ? 'Publique' :
                     formation.visibility_mode === 'catalog_only' ? 'Catalogue' : 'Privée'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Mode de lecture</span>
                  <span className="text-white text-sm">
                    {formation.reading_mode === 'free' ? 'Libre' : 'Linéaire'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/admin/formations/${id}`}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  <Eye size={18} />
                  Modifier la formation
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-200 font-medium">
                  <Download size={18} />
                  Exporter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
