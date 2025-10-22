// app/(dashboard)/admin/select-org/page.tsx - Netflix-style organization picker
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getUserOrganizations } from '@/lib/org-server';
import OrgPicker from './OrgPicker';

export default async function SelectOrgPage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');

  try {
    // Récupérer les organisations de l'utilisateur
    const organizations = await getUserOrganizations();

    if (organizations.length === 0) {
      redirect('/admin'); // Rediriger vers le dispatcher qui gère le cas 0 org
    }

    if (organizations.length === 1) {
      // Une seule organisation - rediriger directement
      const org = organizations[0];
      redirect(`/admin/${org.slug}/formations`);
    }

    // Plusieurs organisations - afficher le picker
    return (
      <div className="min-h-screen bg-[#252525] text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Choisissez votre organisation
            </h1>
            <p className="text-neutral-400 text-lg">
              Sélectionnez l'organisation avec laquelle vous souhaitez travailler
            </p>
          </div>

          {/* Picker Netflix-style */}
          <OrgPicker organizations={organizations} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in select-org page:', error);
    redirect('/login/admin');
  }
}
