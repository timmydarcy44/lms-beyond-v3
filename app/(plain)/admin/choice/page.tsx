import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';
import { getSingleOrg } from '@/lib/org-single';

function firstName(fullName?: string | null, email?: string | null) {
  if (fullName && fullName.trim()) return fullName.trim().split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'là';
}

export default async function OrgChoicePage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  // le prénom doit venir du PROFIL DU USER CONNECTÉ, pas d'une autre personne
  const { data: profile } = await sb
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  try {
    // Utiliser le helper mono-org pour obtenir l'organisation unique
    const org = await getSingleOrg();
    
    // Rediriger vers le dashboard de l'organisation unique
    redirect('/admin/dashboard');
  } catch (error) {
    console.error('[choice] Error getting single org:', error);
    
    // Fallback : charger les organisations de l'utilisateur
    const { data, error: membershipsError } = await sb
      .from('org_memberships')
      .select('organizations!inner(slug,name)')
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('[choice] memberships error', membershipsError);
      redirect('/login/admin');
    }

    const orgs = (data || []).map((r: any) => r.organizations);
    if (orgs.length === 0) redirect('/admin');            // laisser le dispatcher gérer
    if (orgs.length === 1) redirect('/admin/dashboard');

    const hello = firstName(profile?.full_name, user.email);

    return (
      <div className="min-h-screen bg-[#252525] text-neutral-100">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-3xl font-semibold mb-8">
            Bonjour <span className="bg-gradient-to-r from-iris-500 to-cyan-400 bg-clip-text text-transparent">
              {hello}
            </span>
          </h1>

          <p className="text-neutral-400 mb-6">Choisissez votre organisation :</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {orgs.map((o: any) => (
              <Link
                key={o.slug}
                href="/admin/dashboard"
                className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-elev-2 hover:-translate-y-1 transition-all"
              >
                <div className="aspect-[4/3] grid place-items-center bg-gradient-to-br from-iris-500/15 to-cyan-400/10">
                  <div className="text-lg font-medium opacity-90 group-hover:opacity-100 transition text-center px-4">
                    {o.name}
                  </div>
                </div>
                <div className="px-4 py-3 text-sm text-neutral-300 bg-[#262626] border-t border-white/10">
                  Accéder au dashboard
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
