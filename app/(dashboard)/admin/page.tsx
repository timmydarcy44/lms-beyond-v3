// app/(dashboard)/admin/page.tsx - Dispatcher vers 1 org ou picker
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getUserOrganizations } from '@/lib/org-server';

export default async function AdminIndex() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  try {
    // Récupérer les organisations de l'utilisateur
    const organizations = await getUserOrganizations();

    if (organizations.length === 0) {
      // Pas d'organisation - afficher message d'aide
      return (
        <div className="min-h-screen bg-[#252525] text-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Aucune organisation
            </h1>
            <p className="text-neutral-400 mb-6">
              Vous n'êtes membre d'aucune organisation. Contactez votre administrateur pour être ajouté à une organisation.
            </p>
            <a
              href="/login/admin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 font-medium"
            >
              Changer de compte
            </a>
          </div>
        </div>
      );
    }

    if (organizations.length === 1) {
      // Une seule organisation - rediriger directement
      const org = organizations[0];
      redirect(`/admin/${org.slug}/formations`);
    }

    // Plusieurs organisations - rediriger vers le picker
    redirect('/admin/select-org');
  } catch (error) {
    console.error('Error in admin dispatcher:', error);
    redirect('/login/admin');
  }
}