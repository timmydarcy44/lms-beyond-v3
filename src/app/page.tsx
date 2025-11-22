import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/tenant/landing-page";

export default async function Home() {
  // Vérifier d'abord si on est sur un domaine tenant (production uniquement)
  const tenant = await getTenantFromHeaders();
  
  // Ne traiter comme tenant que si ce n'est PAS localhost (pour le développement)
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
  
  console.log('[Home] Hostname:', hostname, 'Tenant:', tenant?.id, 'IsLocalhost:', isLocalhost);
  
  if (tenant && !isLocalhost) {
    // Si c'est le tenant jessica-contentin-app (app.jessicacontentin.fr), rediriger vers la page ressources
    if (tenant.id === 'jessica-contentin-app') {
      redirect('/jessica-contentin/ressources');
    }
    
    // Si c'est le tenant jessica-contentin, rediriger vers le site vitrine
    if (tenant.id === 'jessica-contentin') {
      redirect('/jessica-contentin');
    }
    
    // C'est un tenant en production, afficher la landing page style Netflix
    const supabase = await getServerClient();
    if (supabase) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', tenant.superAdminEmail)
        .maybeSingle();

      let branding = null;
      if (profile) {
        branding = await getSuperAdminBranding(profile.id);
      }

      console.log('[Home] Rendering LandingPage for tenant:', tenant.id);
      return <LandingPage tenant={tenant} branding={branding} />;
    }
  }
  
  console.log('[Home] Using default LMS behavior (localhost or no tenant)');

  // Sinon, comportement par défaut (LMS classique)
  const session = await getSession();

  if (!session) {
    // Si pas de session, rediriger vers la landing page du LMS
    redirect("/landing");
  }

  // Rediriger vers la page de chargement qui affichera "Bonjour (prénom)" puis redirigera vers le dashboard
  redirect("/loading");
}
