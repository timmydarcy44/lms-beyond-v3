import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function AdminIndex() {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await sb.auth.getUser();
  
  if (authError || !user) {
    redirect('/login/admin');
  }

  const { data, error } = await sb
    .from('org_memberships')
    .select('organizations!inner(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const slug = (data as any)?.organizations?.slug;
  if (!slug) {
    redirect('/login/admin'); // fallback
  }

  redirect(`/admin/${slug}`); // ← on pousse vers la route attendue par le guard
}