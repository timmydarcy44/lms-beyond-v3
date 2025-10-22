import { getSingleOrg } from '@/lib/org-single';

export default async function MonoOrgDiagnostic() {
  try {
    const org = await getSingleOrg();
    
    return (
      <div className="min-h-screen bg-[#252525] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Diagnostic Mono-Organisation</h1>
          
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-400 mb-4">✅ Configuration OK</h2>
            <div className="space-y-2">
              <p><strong>Organisation ID:</strong> {org.orgId}</p>
              <p><strong>Slug:</strong> {org.slug || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">📋 Variables d'environnement</h2>
            <div className="space-y-2 text-sm">
              <p><strong>SINGLE_ORG_SLUG:</strong> {process.env.SINGLE_ORG_SLUG || '❌ Manquante'}</p>
              <p><strong>SINGLE_ORG_ID:</strong> {process.env.SINGLE_ORG_ID || '❌ Manquante'}</p>
              <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Définie' : '❌ Manquante'}</p>
              <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Définie' : '❌ Manquante'}</p>
            </div>
          </div>

          <div className="mt-8">
            <a 
              href="/admin/dashboard" 
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition"
            >
              Aller au Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-[#252525] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Diagnostic Mono-Organisation</h1>
          
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-400 mb-4">❌ Erreur de Configuration</h2>
            <p className="text-red-300 mb-4">{error instanceof Error ? error.message : 'Erreur inconnue'}</p>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4">🔧 Configuration Requise</h2>
            <div className="space-y-2 text-sm">
              <p><strong>SINGLE_ORG_SLUG:</strong> Slug de l'organisation unique (ex: jessica-contentin)</p>
              <p><strong>OU SINGLE_ORG_ID:</strong> ID de l'organisation unique</p>
              <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> URL de votre projet Supabase</p>
              <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> Clé anonyme Supabase</p>
            </div>
          </div>

          <div className="mt-8">
            <a 
              href="/api/debug/mono-org" 
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition mr-4"
            >
              API Diagnostic
            </a>
            <a 
              href="/api/debug/env" 
              className="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:opacity-90 transition"
            >
              Variables d'Environnement
            </a>
          </div>
        </div>
      </div>
    );
  }
}
