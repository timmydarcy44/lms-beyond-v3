import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getSingleOrg } from '@/lib/org-single';

export const dynamic = 'force-dynamic';

export default async function LoginAdminPage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    const { slug } = await getSingleOrg();
    redirect('/admin/dashboard');
  }
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-6">
        <h1 className="mb-4 text-lg font-semibold">Connexion administrateur</h1>
        <p className="text-sm opacity-80">Connecte-toi via ton flux habituel.</p>
      </div>
    </main>
  );
}
