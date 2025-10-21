// app/(dashboard)/admin/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';

export default async function AdminIndex() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  // Récupérer toutes les organisations de l'utilisateur
  const { data: memberships } = await sb
    .from('org_memberships')
    .select(`
      organizations!inner(
        id,
        name,
        slug,
        description
      )
    `)
    .eq('user_id', user.id);

  if (!memberships || memberships.length === 0) {
    redirect('/login/admin');
  }

  // Si une seule organisation, rediriger directement
  if (memberships.length === 1) {
    const org = memberships[0].organizations as any;
    redirect(`/admin/${org.slug}`);
  }

  // Afficher la page de sélection d'organisation
  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Sélectionnez votre organisation
          </h1>
          <p className="text-neutral-400 text-lg">
            Choisissez l'organisation avec laquelle vous souhaitez travailler
          </p>
        </div>

        {/* Liste des organisations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {memberships.map((membership: any) => {
            const org = membership.organizations;
            return (
              <Link
                key={org.id}
                href={`/admin/${org.slug}`}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Building2 size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {org.name}
                      </h3>
                      <p className="text-neutral-400 text-sm">
                        Organisation
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                
                {org.description && (
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    {org.description}
                  </p>
                )}
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <span className="text-xs text-neutral-500">
                    Slug: {org.slug}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="text-center mt-12">
          <Link
            href="/login/admin"
            className="inline-flex items-center gap-2 px-6 py-3 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowRight size={16} className="rotate-180" />
            Changer de compte
          </Link>
        </div>
      </div>
    </div>
  );
}