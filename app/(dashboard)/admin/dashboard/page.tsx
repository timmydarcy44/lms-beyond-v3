import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSingleOrg } from '@/lib/org-single';

function firstName(fullName?: string | null, email?: string | null) {
  if (fullName && fullName.trim()) return fullName.trim().split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'là';
}

export default async function AdminDashboard() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  
  if (!user) redirect('/login/admin');

  // Récupérer le prénom du profil utilisateur
  const { data: profile } = await sb
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  // Récupérer les statistiques de l'organisation unique
  const { orgId } = await getSingleOrg();
  
  const [formationsResult, parcoursResult, testsResult, ressourcesResult] = await Promise.all([
    sb.from('formations').select('id').eq('org_id', orgId),
    sb.from('pathways').select('id').eq('org_id', orgId),
    sb.from('tests').select('id').eq('org_id', orgId),
    sb.from('resources').select('id').eq('org_id', orgId)
  ]);

  const stats = {
    formations: formationsResult.data?.length || 0,
    parcours: parcoursResult.data?.length || 0,
    tests: testsResult.data?.length || 0,
    ressources: ressourcesResult.data?.length || 0
  };

  const hello = firstName(profile?.full_name, user.email);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          Bonjour <span className="bg-gradient-to-r from-iris-500 to-cyan-400 bg-clip-text text-transparent">
            {hello}
          </span>
        </h1>
        <p className="text-neutral-400">Bienvenue dans votre espace d'administration</p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.formations}</div>
          <div className="text-sm text-neutral-400">Formations</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.parcours}</div>
          <div className="text-sm text-neutral-400">Parcours</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.tests}</div>
          <div className="text-sm text-neutral-400">Tests</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.ressources}</div>
          <div className="text-sm text-neutral-400">Ressources</div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <a 
          href="/admin/formations/new"
          className="bg-gradient-to-r from-iris-500 to-cyan-400 text-white rounded-xl p-4 hover:opacity-90 transition"
        >
          <div className="font-semibold">Nouvelle Formation</div>
          <div className="text-sm opacity-90">Créer une formation</div>
        </a>
        
        <a 
          href="/admin/parcours/new"
          className="bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-xl p-4 hover:opacity-90 transition"
        >
          <div className="font-semibold">Nouveau Parcours</div>
          <div className="text-sm opacity-90">Créer un parcours</div>
        </a>
        
        <a 
          href="/admin/tests/new"
          className="bg-gradient-to-r from-green-500 to-emerald-400 text-white rounded-xl p-4 hover:opacity-90 transition"
        >
          <div className="font-semibold">Nouveau Test</div>
          <div className="text-sm opacity-90">Créer un test</div>
        </a>
        
        <a 
          href="/admin/ressources/new"
          className="bg-gradient-to-r from-orange-500 to-red-400 text-white rounded-xl p-4 hover:opacity-90 transition"
        >
          <div className="font-semibold">Nouvelle Ressource</div>
          <div className="text-sm opacity-90">Ajouter une ressource</div>
        </a>
      </div>
    </div>
  );
}
