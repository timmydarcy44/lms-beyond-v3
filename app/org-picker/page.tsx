import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/server/auth';
import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';
import Button from '@/components/cine/Button';

export const dynamic = 'force-dynamic';

export default async function OrgPicker() {
  // Si SINGLE_ORG_SLUG est défini, le middleware redirigera automatiquement
  if (process.env.SINGLE_ORG_SLUG) {
    return null;
  }
  
  const { sb } = await requireUser();
  
  const { data: rows } = await sb
    .from("org_memberships")
    .select(`
      id,
      role,
      organizations:org_id (
        id,
        slug,
        name
      )
    `);

  const memberships = (rows || []).map((r: any) => ({
    id: r.organizations.id,
    slug: r.organizations.slug,
    name: r.organizations.name,
    role: r.role
  }));

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

  if (memberships.length === 1) {
    redirect(`/admin/${memberships[0].slug}`);
  }

  return (
    <main className="min-h-screen bg-bg text-text p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choisir une organisation</h1>
          <p className="text-muted">
            Sélectionnez l'organisation dans laquelle vous souhaitez travailler
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {memberships.map((org) => (
            <div
              key={org.id}
              className="bg-surfaceAlt border border-border rounded-xl p-6 hover:bg-surface transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{org.name}</h3>
                  <p className="text-sm text-muted">
                    Slug: <code className="bg-bg px-1 rounded">{org.slug}</code>
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-md bg-primary/20 text-primary">
                  {org.role}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Link 
                  href={`/admin/${org.slug}`}
                  className="flex-1 px-4 h-10 grid place-items-center rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                >
                  Entrer dans l'admin
                </Link>
                <Link 
                  href={`/app/${org.slug}`}
                  className="px-4 h-10 grid place-items-center rounded-lg bg-surface text-text border border-border hover:bg-surfaceAlt transition-colors"
                >
                  App
                </Link>
              </div>
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
