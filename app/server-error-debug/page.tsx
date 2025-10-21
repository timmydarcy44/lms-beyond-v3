export default function ServerErrorDebug() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Debug Server Error</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Test des API Routes</h2>
            <div className="space-y-2">
              <a 
                href="/api/env-check" 
                className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
              >
                Test Variables d'Environnement
              </a>
              <a 
                href="/api/supa-admin" 
                className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
              >
                Test Supabase Admin
              </a>
              <a 
                href="/api/supa-ssr" 
                className="block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center"
              >
                Test Supabase SSR
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Test des Pages</h2>
            <div className="space-y-2">
              <a 
                href="/login/admin" 
                className="block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-center"
              >
                Test Login Admin
              </a>
              <a 
                href="/env-diagnostic" 
                className="block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-center"
              >
                Test Diagnostic Env
              </a>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded text-sm">
            <p className="text-gray-300 mb-2">Si vous voyez cette page, le problème vient des Server Components qui utilisent Supabase.</p>
            <p className="text-gray-300">Testez les liens ci-dessus pour identifier le problème exact.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
