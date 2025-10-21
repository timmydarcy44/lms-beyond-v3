'use client';

export default function AuthDiagnostic() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Diagnostic d'Authentification</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Test de Connexion Supabase</h2>
            <div className="space-y-4">
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth-debug?email=timmydarcy44@gmail.com');
                    const data = await response.json();
                    alert(`Auth Debug: ${JSON.stringify(data, null, 2)}`);
                  } catch (error) {
                    alert(`Erreur: ${error}`);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tester Auth Debug (timmydarcy44@gmail.com)
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/supa-admin');
                    const data = await response.json();
                    alert(`Supabase Admin: ${JSON.stringify(data, null, 2)}`);
                  } catch (error) {
                    alert(`Erreur: ${error}`);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Tester Supabase Admin
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Test de Session</h2>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/supa-ssr');
                  const data = await response.json();
                  alert(`Session SSR: ${JSON.stringify(data, null, 2)}`);
                } catch (error) {
                  alert(`Erreur: ${error}`);
                }
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Tester Session SSR
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Test de Middleware</h2>
            <div className="space-y-2">
              <a 
                href="/admin" 
                className="block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-center"
              >
                Tester /admin (devrait rediriger vers /login)
              </a>
              <a 
                href="/login/admin" 
                className="block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-center"
              >
                Tester /login/admin (devrait afficher le formulaire)
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Informations de Debug</h2>
            <div className="bg-gray-700 p-4 rounded text-sm">
              <p className="text-gray-300 mb-2">URL actuelle: {typeof window !== 'undefined' ? window.location.href : 'Server'}</p>
              <p className="text-gray-300 mb-2">User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'}</p>
              <p className="text-gray-300">Timestamp: {new Date().toISOString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
