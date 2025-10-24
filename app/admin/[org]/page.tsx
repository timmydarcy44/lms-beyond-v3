import { resolveOrgFromParamsOrMembership } from "@/lib/server/org-context";

export const dynamic = 'force-dynamic';

export default async function AdminHome({ 
  params 
}: { 
  params: Promise<{ org: string }> 
}) {
  const { org } = await params;
  const { orgId, orgSlug, orgName, userRole } = await resolveOrgFromParamsOrMembership(org);
  
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Administration — {orgName}</h1>
            <p className="text-muted">
              Organisation: <code className="bg-surfaceAlt px-2 py-1 rounded">{orgSlug}</code>
            </p>
            <p className="text-sm text-muted mt-2">
              Votre rôle: <span className="px-2 py-1 rounded-md bg-primary/20 text-primary">{userRole}</span>
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-surfaceAlt border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Formations</h3>
              <p className="text-muted text-sm mb-4">Gérez vos formations et contenus</p>
              <a 
                href={`/admin/${orgSlug}/formations`}
                className="inline-block px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Voir les formations
              </a>
            </div>
            
            <div className="bg-surfaceAlt border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Parcours</h3>
              <p className="text-muted text-sm mb-4">Créez des parcours d'apprentissage</p>
              <a 
                href={`/admin/${orgSlug}/parcours`}
                className="inline-block px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Voir les parcours
              </a>
            </div>
            
            <div className="bg-surfaceAlt border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Ressources</h3>
              <p className="text-muted text-sm mb-4">Bibliothèque de ressources</p>
              <a 
                href={`/admin/${orgSlug}/ressources`}
                className="inline-block px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Voir les ressources
              </a>
            </div>
            
            <div className="bg-surfaceAlt border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Tests</h3>
              <p className="text-muted text-sm mb-4">Évaluations et quiz</p>
              <a 
                href={`/admin/${orgSlug}/tests`}
                className="inline-block px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Voir les tests
              </a>
            </div>
            
            <div className="bg-surfaceAlt border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Dashboard</h3>
              <p className="text-muted text-sm mb-4">Vue d'ensemble détaillée</p>
              <a 
                href={`/admin/${orgSlug}/dashboard`}
                className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Accéder au dashboard
              </a>
            </div>
            
            <div className="bg-surfaceAlt border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Organisations</h3>
              <p className="text-muted text-sm mb-4">Changer d'organisation</p>
              <a 
                href="/org-picker"
                className="inline-block px-4 py-2 bg-surface text-text border border-border rounded-lg hover:bg-surfaceAlt transition-colors"
              >
                Sélecteur d'org
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
