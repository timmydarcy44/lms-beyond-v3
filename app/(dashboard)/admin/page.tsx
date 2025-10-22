import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getSingleOrg } from '@/lib/org-single';

export default async function AdminIndex() {
  try {
    const sb = await supabaseServer();
    const { data: { user }, error: authError } = await sb.auth.getUser();
    
    if (authError) {
      console.error('[admin/page] Auth error:', authError);
      redirect('/login/admin');
    }
    
    if (!user) {
      console.log('[admin/page] No user found, redirecting to login');
      redirect('/login/admin');
    }

    // Vérifier que l'utilisateur est admin de l'organisation unique
    const { orgId } = await getSingleOrg();
    const { data: membership, error: membershipError } = await sb
      .from('org_memberships')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership || membership.role !== 'admin') {
      console.error('[admin/page] Not admin or membership error:', membershipError);
      redirect('/unauthorized');
    }

    // Rediriger vers le dashboard
    redirect('/admin/dashboard');
  } catch (error) {
    console.error('[admin/page] Unexpected error:', error);
    redirect('/login/admin');
  }
}