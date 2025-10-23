import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getOrgBySlug, getSessionUser, requireOrgAccess } from '@/lib/orgs';
import { logServerError } from '@/lib/debug';

export const dynamic = 'force-dynamic'; // évite cache sur page pivot

export default async function OrgDashboardPage({ params }: { params: { org: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      redirect('/login/admin');
    }

    const org = await getOrgBySlug(params.org);
    if (!org) {
      // slug d'org inexistant → 404 claire
      notFound();
    }

    // Vérifie l'appartenance (et rôle si besoin). Ici lecture pour membres.
    await requireOrgAccess(user.id, org.id);

    const sb = await supabaseServer();

    // Exemple: récupérer des formations de l'org courante
    const { data: formations, error } = await sb
      .from('formations')
      .select('id,title,updated_at')
      .eq('org_id', org.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4">Dashboard — {org.name}</h1>
        <ul className="space-y-1">
          {(formations ?? []).map(f => (
            <li key={f.id} className="text-gray-300">{f.title}</li>
          ))}
          {(!formations || formations.length === 0) && <li>Aucune formation</li>}
        </ul>
      </main>
    );
  } catch (e) {
    // Log précis pour Vercel
    logServerError('admin/[org]/dashboard', e, { params });
    // Re-lancer pour que Next affiche la page error.tsx locale
    throw e;
  }
}
