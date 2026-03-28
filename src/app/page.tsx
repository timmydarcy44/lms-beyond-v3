import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/tenant/landing-page";
import { BeyondCenterHome } from "@/components/beyond-center/beyond-center-home";
import { generateSEOMetadata } from "@/lib/seo/jessica-contentin-seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromHeaders();
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const isLocalhost =
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    hostname.includes("localhost");

  if (tenant?.id === "jessica-contentin" && !isLocalhost) {
    return {
      ...generateSEOMetadata("home"),
      metadataBase: new URL("https://jessicacontentin.fr"),
    };
  }

  if (tenant?.id === "jessica-contentin-app" && !isLocalhost) {
    return {
      ...generateSEOMetadata("ressources"),
      metadataBase: new URL("https://app.jessicacontentin.fr"),
    };
  }

  const hostOnly = hostname.split(":")[0]?.replace(/^www\./i, "").toLowerCase() ?? "";
  if (hostOnly === "beyondcenter.fr" && !isLocalhost) {
    return {
      metadataBase: new URL("https://beyondcenter.fr"),
      title: "Beyond Center | Performance cognitive pour les entreprises",
      description:
        "Comprenez comment vos équipes fonctionnent. Définissez une stratégie de développement adaptée. Déployez la performance via une plateforme digitale propriétaire.",
      alternates: {
        canonical: "https://beyondcenter.fr/",
      },
    };
  }

  return {
    title: "Beyond Center | Performance cognitive pour les entreprises",
    description:
      "Comprenez comment vos équipes fonctionnent. Définissez une stratégie de développement adaptée. Déployez la performance via une plateforme digitale propriétaire.",
  };
}

export default async function Home() {
  // Vérifier d'abord si on est sur un domaine tenant (production uniquement)
  const tenant = await getTenantFromHeaders();
  
  // Ne traiter comme tenant que si ce n'est PAS localhost (pour le développement)
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1') || hostname.includes('localhost');
  
  console.log('[Home] Hostname:', hostname, 'Tenant:', tenant?.id, 'IsLocalhost:', isLocalhost);
  
  if (tenant && !isLocalhost) {
    // Si c'est le tenant jessica-contentin-app (app.jessicacontentin.fr), rediriger vers la page ressources
    if (tenant.id === 'jessica-contentin-app') {
      redirect('/ressources');
    }
    
    // Si c'est le tenant jessica-contentin, servir directement la page d'accueil
    if (tenant.id === 'jessica-contentin') {
      // Importer et servir directement la page Jessica Contentin
      const { default: JessicaContentinHomePage } = await import('@/app/jessica-contentin/page');
      const { JessicaContentinLayout } = await import('@/app/jessica-contentin/layout');
      return (
        <JessicaContentinLayout>
          <JessicaContentinHomePage />
        </JessicaContentinLayout>
      );
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

  // Sinon, page d'accueil Beyond Center (B2B)
  const session = await getSession();
  if (session) {
    redirect("/dashboard/profil");
  }

  return <BeyondCenterHome />;
}
