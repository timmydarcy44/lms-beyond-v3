import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'; // évite caches/ISR sur la route pivot

export default async function AdminIndexPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    // Utilisateur non connecté → aller vers la page de login admin
    redirect('/login/admin');
  }

  // Utilisateur connecté → aller vers le dashboard
  redirect('/admin/dashboard');
}
