export default function EnvDiagnostic() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Diagnostic des Variables d'Environnement</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Variables Client (NEXT_PUBLIC_*)</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">NEXT_PUBLIC_SUPABASE_URL:</span>
                <span className="text-green-400">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Définie' : '❌ Manquante'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <span className="text-green-400">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Définie' : '❌ Manquante'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">NEXT_PUBLIC_SITE_URL:</span>
                <span className="text-green-400">
                  {process.env.NEXT_PUBLIC_SITE_URL ? '✅ Définie' : '❌ Manquante'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Valeurs (partielles)</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-300">SUPABASE_URL:</span>
                <span className="text-blue-400 ml-2">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...
                </span>
              </div>
              <div>
                <span className="text-gray-300">SITE_URL:</span>
                <span className="text-blue-400 ml-2">
                  {process.env.NEXT_PUBLIC_SITE_URL || 'Non définie'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Actions</h2>
            <div className="space-y-2">
              <a 
                href="/login/admin" 
                className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tester /login/admin
              </a>
              <a 
                href="/admin" 
                className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Tester /admin
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
