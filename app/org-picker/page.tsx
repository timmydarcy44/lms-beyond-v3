import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/server/auth';
import { getUserMemberships, pickDefaultOrg } from '@/lib/server/org-context';
import Button from '@/components/cine/Button';

export const dynamic = 'force-dynamic';

export default async function OrgPickerPage() {
  const { sb, user } = await requireUser();
  
  // Si SINGLE_ORG_SLUG est défini, rediriger directement
  const singleOrgSlug = process.env.SINGLE_ORG_SLUG;
  if (singleOrgSlug) {
    redirect(`/admin/${singleOrgSlug}`);
  }
  
  // Récupérer les membreships de l'utilisateur
  const memberships = await getUserMemberships(sb, user.id);
  
  // Si aucun membership, afficher message d'erreur
  if (memberships.length === 0) {
    return (
      <main className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-surfaceAlt p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Aucune organisation</h1>
          <p className="text-muted mb-6">
            Vous n'êtes membre d'aucune organisation. Contactez votre administrateur pour obtenir un accès.
          </p>
          <Button 
            onClick={() => window.location.href = '/login'}
            variant="primary"
          >
            Retour à la connexion
          </Button>
        </div>
      </main>
    );
  }
  
  // Si une seule org, rediriger directement
  if (memberships.length === 1) {
    redirect(`/admin/${memberships[0].slug}`);
  }
  
  // Afficher la liste des organisations
  return (
    <main className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choisissez une organisation</h1>
          <p className="text-muted">
            Sélectionnez l'organisation dans laquelle vous souhaitez travailler
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {memberships.map((org) => (
            <div
              key={org.id}
              className="rounded-2xl border border-border bg-surfaceAlt p-6 hover:bg-surface transition-colors cursor-pointer"
              onClick={() => {
                window.location.href = `/admin/${org.slug}`;
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{org.name}</h3>
                <span className="text-xs px-2 py-1 rounded-md bg-primary/20 text-primary">
                  {org.role}
                </span>
              </div>
              <p className="text-sm text-muted mb-4">
                Slug: <code className="bg-bg px-1 rounded">{org.slug}</code>
              </p>
              <Button 
                variant="primary" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/admin/${org.slug}`;
                }}
              >
                Entrer dans l'admin
              </Button>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Button 
            onClick={() => window.location.href = '/login'}
            variant="ghost"
          >
            Changer de compte
          </Button>
        </div>
      </div>
    </main>
  );
}
