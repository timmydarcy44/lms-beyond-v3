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

    try {
      // Utiliser le helper mono-org pour obtenir l'organisation unique
      const org = await getSingleOrg();
      
      // Rediriger vers le dashboard de l'organisation unique
      redirect('/admin/dashboard');
    } catch (error) {
      console.error('[admin/page] Error getting single org:', error);
      
      // Fallback : charger les organisations de l'utilisateur
      const { data, error: membershipsError } = await sb
        .from('org_memberships')
        .select('organizations!inner(slug,name)')
        .eq('user_id', user.id);

      if (membershipsError) {
        console.error('[admin/page] memberships error', membershipsError);
        redirect('/login/admin');
      }

      const orgs = (data || []).map((r: any) => r.organizations);
      if (orgs.length === 0) {
        return (
          <div className="min-h-[60vh] grid place-items-center text-neutral-300">
            Aucune organisation associée à votre compte.
          </div>
        );
      }
      if (orgs.length === 1) redirect('/admin/dashboard');
      // multi-org → vers la page choice SANS layout dashboard
      redirect('/admin/choice');
    }
  } catch (error) {
    console.error('[admin/page] Unexpected error:', error);
    redirect('/login/admin');
  }
}