// app/(dashboard)/admin/select-org/page.tsx - Netflix-style organization picker (full screen)
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
    .select('organizations!inner(slug,name,cover_url)')
    .eq('user_id', user.id);

  const orgs = (data || []).map((r: any) => r.organizations);
  if (orgs.length === 0) {
    return (
      <div className="min-h-screen bg-[#252525] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Aucune organisation</h1>
          <p className="text-neutral-400 mb-6">Aucune organisation n'est associée à votre compte.</p>
          <Link 
            href="/login/admin" 
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 font-medium"
          >
            Changer de compte
          </Link>
        </div>
      </div>
    );
  }
  
  // Toujours afficher la page de choix, même pour une seule organisation
  // Cela permet un flux cohérent : Login → Choix → Dashboard

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      {/* Header Netflix-style */}
      <div className="px-8 py-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          {orgs.length === 1 ? 'Votre organisation' : 'Choisissez votre organisation'}
        </h1>
        <p className="text-neutral-400 text-lg">
          {orgs.length === 1 
            ? 'Accédez à votre espace de travail'
            : 'Sélectionnez l\'organisation avec laquelle vous souhaitez travailler'
          }
        </p>
      </div>

      {/* Grid des organisations */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {orgs.map((org: any) => (
            <Link
              key={org.slug}
              href={`/admin/${org.slug}/formations`}
              className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              {/* Image de couverture ou gradient */}
              <div className="aspect-[4/3] relative overflow-hidden">
                {org.cover_url ? (
                  <img 
                    src={org.cover_url} 
                    alt={org.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <div className="text-2xl font-bold text-white/80">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                
                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>

              {/* Informations */}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">
                  {org.name}
                </h3>
                <p className="text-sm text-neutral-400">
                  {org.slug}
                </p>
              </div>

              {/* Indicateur de sélection */}
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white/60" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 border-t border-white/10">
        <div className="text-center text-neutral-400 text-sm">
          <p>Besoin d'aide ? Contactez votre administrateur système</p>
        </div>
      </div>
    </div>
  );
}
