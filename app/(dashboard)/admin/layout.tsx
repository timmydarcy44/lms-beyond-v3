// app/(dashboard)/admin/layout.tsx
export const dynamic = 'force-dynamic'; export const revalidate = 0;
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getPrimaryRole } from '@/lib/roles';
import AdminLayoutClient from '@/components/layout/AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login/admin');
  const role = await getPrimaryRole(user.id);
  if (role !== 'admin') redirect('/unauthorized');
  
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}