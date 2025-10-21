'use client';

export default function CreateAdmin() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Créer un Admin</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300 mb-4">
            Si vous ne pouvez pas vous connecter, c'est probablement parce que votre utilisateur n'existe pas dans le projet Supabase de Vercel.
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug-create-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: 'timmydarcy44@gmail.com',
                      password: 'votre-mot-de-passe'
                    })
                  });
                  const data = await response.json();
                  alert(`Résultat: ${JSON.stringify(data, null, 2)}`);
                } catch (error) {
                  alert(`Erreur: ${error}`);
                }
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Créer Admin (timmydarcy44@gmail.com)
            </button>
            
            <div className="text-sm text-gray-400">
              <p>Cette action va :</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Créer l'utilisateur dans Supabase</li>
                <li>Lui donner le rôle 'admin'</li>
                <li>L'ajouter à votre organisation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
