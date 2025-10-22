import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginAdminPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (user) {
    // Si déjà connecté, aller DIRECTEMENT vers le dashboard
    redirect('/admin/dashboard');
  }

  // Affiche l'UI de connexion
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-6">
        <h1 className="mb-4 text-lg font-semibold">Connexion administrateur</h1>
        <LoginForm />
      </div>
    </main>
  );
}