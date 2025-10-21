// app/debug-timmy/page.tsx
'use client';
import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

export default function DebugTimmyPage() {
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [fixResult, setFixResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/timmy-org');
      const data = await response.json();
      setDiagnostic(data);
    } catch (error) {
      console.error('Error running diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixOrganization = async () => {
    setFixing(true);
    try {
      const response = await fetch('/api/fix-timmy-org', { method: 'POST' });
      const data = await response.json();
      setFixResult(data);
      
      // Relancer le diagnostic après la réparation
      setTimeout(() => {
        runDiagnostic();
      }, 1000);
    } catch (error) {
      console.error('Error fixing organization:', error);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#252525] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Diagnostic Timmy Organization
          </h1>
          <p className="text-neutral-400">
            Diagnostic et réparation des problèmes d'organisation
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={runDiagnostic}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Diagnostic...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Lancer le diagnostic
              </>
            )}
          </button>

          <button
            onClick={fixOrganization}
            disabled={fixing || !diagnostic}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            {fixing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Réparation...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Réparer l'organisation
              </>
            )}
          </button>
        </div>

        {/* Résultats du diagnostic */}
        {diagnostic && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Résultats du Diagnostic</h2>
              <p className="text-neutral-400">État actuel de l'utilisateur et des organisations</p>
            </div>
            <div className="space-y-4">
              {/* Utilisateur */}
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Utilisateur</h3>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p><strong>Email:</strong> {diagnostic.user?.email}</p>
                  <p><strong>ID:</strong> {diagnostic.user?.id}</p>
                  <p><strong>Créé le:</strong> {new Date(diagnostic.user?.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Organisations */}
              <div>
                <h3 className="font-semibold text-purple-400 mb-2">Organisations</h3>
                <div className="bg-white/5 p-3 rounded-lg">
                  {diagnostic.organizations?.data?.length > 0 ? (
                    <div className="space-y-2">
                      {diagnostic.organizations.data.map((org: any) => (
                        <div key={org.id} className="border-l-2 border-purple-400 pl-3">
                          <p><strong>Nom:</strong> {org.name}</p>
                          <p><strong>Slug:</strong> {org.slug}</p>
                          <p><strong>ID:</strong> {org.id}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-orange-400">Aucune organisation trouvée</p>
                  )}
                </div>
              </div>

              {/* Membres d'organisation */}
              <div>
                <h3 className="font-semibold text-green-400 mb-2">Membres d'Organisation</h3>
                <div className="bg-white/5 p-3 rounded-lg">
                  {diagnostic.memberships?.data?.length > 0 ? (
                    <div className="space-y-2">
                      {diagnostic.memberships.data.map((membership: any) => (
                        <div key={membership.id} className="border-l-2 border-green-400 pl-3">
                          <p><strong>Rôle:</strong> {membership.role}</p>
                          <p><strong>Organisation:</strong> {membership.organizations?.name}</p>
                          <p><strong>ID:</strong> {membership.id}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-400">Aucun membership trouvé - C'est le problème !</p>
                  )}
                </div>
              </div>

              {/* Formations */}
              <div>
                <h3 className="font-semibold text-pink-400 mb-2">Formations</h3>
                <div className="bg-white/5 p-3 rounded-lg">
                  {diagnostic.formations?.data?.length > 0 ? (
                    <div className="space-y-2">
                      {diagnostic.formations.data.map((formation: any) => (
                        <div key={formation.id} className="border-l-2 border-pink-400 pl-3">
                          <p><strong>Titre:</strong> {formation.title}</p>
                          <p><strong>Org ID:</strong> {formation.org_id || 'NULL'}</p>
                          <p><strong>ID:</strong> {formation.id}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-orange-400">Aucune formation trouvée</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Résultats de la réparation */}
        {fixResult && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Résultats de la Réparation</h2>
              <p className="text-neutral-400">Résultat de la création/réparation de l'organisation</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-400">{fixResult.message}</span>
              </div>
              
              {fixResult.organization && (
                <div className="mt-3 space-y-1">
                  <p><strong>Organisation créée:</strong> {fixResult.organization.name}</p>
                  <p><strong>Slug:</strong> {fixResult.organization.slug}</p>
                  <p><strong>ID:</strong> {fixResult.organization.id}</p>
                </div>
              )}
              
              {fixResult.membership && (
                <div className="mt-3 space-y-1">
                  <p><strong>Membership créé:</strong> Rôle {fixResult.membership.role}</p>
                  <p><strong>ID:</strong> {fixResult.membership.id}</p>
                </div>
              )}
              
              <p className="mt-3 text-sm text-neutral-400">
                Formations mises à jour: {fixResult.updatedFormations}
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">Instructions</h2>
          </div>
          <div className="space-y-2 text-sm text-neutral-300">
            <p>1. <strong>Lancer le diagnostic</strong> pour voir l'état actuel</p>
            <p>2. <strong>Réparer l'organisation</strong> si aucun membership n'est trouvé</p>
            <p>3. <strong>Recharger la page</strong> après la réparation</p>
            <p>4. <strong>Retourner aux formations</strong> pour vérifier que tout fonctionne</p>
          </div>
        </div>
      </div>
    </div>
  );
}