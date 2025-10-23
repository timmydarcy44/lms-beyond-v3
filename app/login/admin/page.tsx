import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSessionUser, getOrgsForUser } from '@/lib/orgs';

export const dynamic = 'force-dynamic';

export default async function LoginAdminPage() {
  const user = await getSessionUser();
  if (user) {
    const orgs = await getOrgsForUser(user.id);
    if (orgs.length) redirect(`/admin/${orgs[0].slug}/dashboard`);
    redirect('/choice');
  }

  // … mets ton UI de connexion réelle ici
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-6">
        <h1 className="mb-4 text-lg font-semibold">Connexion administrateur</h1>
        <p className="text-sm opacity-80">Connecte-toi via ton flux habituel.</p>
      </div>
    </main>
  );
}