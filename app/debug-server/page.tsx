// app/debug-server/page.tsx
import { supabaseServer } from '@/lib/supabase/server';
import { getPrimaryRole } from '@/lib/roles';

export default async function DebugServerPage() {
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return (
        <div className="min-h-screen bg-[#252525] text-white p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Non authentifié</h1>
            <p className="text-neutral-400">Veuillez vous connecter pour voir les détails.</p>
          </div>
        </div>
      );
    }

    const role = await getPrimaryRole(user.id);
    
    // Test des organisations
    const { data: orgs, error: orgsError } = await sb
      .from('organizations')
      .select('*');

    // Test des membres d'organisation
    const { data: memberships, error: membershipsError } = await sb
      .from('org_memberships')
      .select(`
        *,
        organizations(*)
      `)
      .eq('user_id', user.id);

    return (
      <div className="min-h-screen bg-[#252525] text-white p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Debug Server Components
          </h1>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Utilisateur</h2>
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Rôle:</strong> {role || 'Aucun rôle'}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Organisations</h2>
            {orgsError ? (
              <p className="text-red-400">Erreur: {orgsError.message}</p>
            ) : (
              <div className="space-y-2 text-sm">
                {orgs?.map((org: any) => (
                  <div key={org.id} className="border-l-2 border-blue-400 pl-3">
                    <p><strong>Nom:</strong> {org.name}</p>
                    <p><strong>Slug:</strong> {org.slug}</p>
                    <p><strong>ID:</strong> {org.id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Membres d'Organisation</h2>
            {membershipsError ? (
              <p className="text-red-400">Erreur: {membershipsError.message}</p>
            ) : (
              <div className="space-y-2 text-sm">
                {memberships?.map((membership: any) => (
                  <div key={membership.id} className="border-l-2 border-green-400 pl-3">
                    <p><strong>Rôle:</strong> {membership.role}</p>
                    <p><strong>Organisation:</strong> {membership.organizations?.name}</p>
                    <p><strong>ID:</strong> {membership.id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-[#252525] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Erreur Server Component</h1>
          <pre className="text-red-300 text-sm whitespace-pre-wrap bg-black/20 p-4 rounded">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
          {error instanceof Error && error.stack && (
            <details className="mt-4">
              <summary className="text-neutral-400 cursor-pointer">Stack trace</summary>
              <pre className="text-neutral-300 text-xs whitespace-pre-wrap bg-black/20 p-4 rounded mt-2">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
