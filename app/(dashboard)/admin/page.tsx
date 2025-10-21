import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminIndex() {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await sb.auth.getUser();
  
  if (authError || !user) {
    redirect('/login/admin');
  }

  const { data, error } = await sb
    .from('org_memberships')
    .select('organizations!inner(slug, name)')
    .eq('user_id', user.id);

  if (error || !data || data.length === 0) {
    redirect('/login/admin');
  }

  // Si une seule org, rediriger directement
  if (data.length === 1) {
    const slug = (data[0] as any).organizations.slug;
    redirect(`/admin/${slug}`);
  }

  // Si plusieurs orgs, afficher le sélecteur
  return (
    <div className="min-h-screen bg-gradient-to-br from-iris-900 via-purple-900 to-blush-900 flex items-center justify-center p-4">
      <div className="glass p-8 rounded-2xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Sélectionner une organisation
        </h1>
        <p className="text-white/70 text-center mb-8">
          Vous avez accès à plusieurs organisations. Choisissez celle avec laquelle vous souhaitez travailler.
        </p>
        
        <div className="space-y-3">
          {data.map((membership: any) => (
            <Link
              key={membership.org_id}
              href={`/admin/${membership.organizations.slug}`}
              className="block p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-iris-300">
                    {membership.organizations.name}
                  </h3>
                  <p className="text-sm text-white/70">
                    {membership.organizations.slug}
                  </p>
                </div>
                <div className="text-white/50 group-hover:text-white/70">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}