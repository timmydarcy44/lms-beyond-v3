import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function AdminIndexPage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');
  redirect('/admin/dashboard');
}
