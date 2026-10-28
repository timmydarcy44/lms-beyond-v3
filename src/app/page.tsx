import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { isJessicaContentinMarketingHostname } from "@/lib/tenant/config";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/tenant/landing-page";
import { BeyondSaasLanding } from "@/components/marketing/beyond-saas-landing";
import { generateSEOMetadata } from "@/lib/seo/jessica-contentin-seo";
import { isByoundCareHostname } from "@/lib/care/host";
import { CARE_SEO, carePageMetadata } from "@/lib/care/seo";
import { BYOUND_PUBLIC_ORIGIN, bareHostname } from "@/lib/edge-site/byound-host";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromHeaders();
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const isLocalhost =
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    hostname.includes("localhost");

  const hostOnly = bareHostname(hostname);
  if (isByoundCareHostname(hostname) && !isLocalhost) {
    return carePageMetadata({
      title: CARE_SEO.homeTitle,
      description: CARE_SEO.homeDescription,
      internalPath: "/care",
    });
  }
  if ((hostOnly === "edgebs.fr" || hostOnly === "byound.fr") && !isLocalhost) {
    const { loadSeoPage, toNextMetadata } = await import("@/lib/seo/byound-seo");
    return toNextMetadata(await loadSeoPage("/"));
  }
  if ((tenant?.id === "jessica-contentin" || isJessicaContentinMarketingHostname(hostname)) && !isLocalhost) {
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

  if (hostOnly === "beyondcenter.fr" && !isLocalhost) {
    return {
      metadataBase: new URL("https://beyondcenter.fr"),
      title: "Beyond — Optimisation de la performance commerciale",
      description:
        "CRM, pipeline, automatisation et IA pour accélérer la conversion et le pilotage commercial.",
      alternates: {
        canonical: "https://beyondcenter.fr/",
      },
    };
  }

  return {
    title: "Beyond | Pilotez les compétences. Pas les intuitions.",
    description:
      "Plateforme d'intelligence des compétences pour entreprises, CFA et écoles : cartographie, écarts, parcours, Open Badges et pilotage par la donnée et l'IA.",
  };
}

export default async function Home() {
  // Vérifier d'abord si on est sur un domaine tenant (production uniquement)
  const tenant = await getTenantFromHeaders();
  
  // Ne traiter comme tenant que si ce n'est PAS localhost (pour le développement)
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1') || hostname.includes('localhost');
  const hostOnly = bareHostname(hostname);

  /** Byound Care — domaine dédié (filet si le rewrite / → /care n’est pas appliqué). */
  if (!isLocalhost && isByoundCareHostname(hostname)) {
    const { default: CareHomePage } = await import("@/app/care/page");
    const { default: CareLayout } = await import("@/app/care/layout");
    return (
      <CareLayout>
        <CareHomePage />
      </CareLayout>
    );
  }

  /** Beyond Center — agence développement sur mesure */
  if (!isLocalhost && hostOnly === "beyondcenter.fr") {
    const { BeyondAgencyHome } = await import("@/components/beyond-center/agency/beyond-agency-home");
    return <BeyondAgencyHome />;
  }

  /** Byound Lab sur domaine dédié. */
  if (!isLocalhost && (hostOnly === "edgebs.fr" || hostOnly === "byound.fr")) {
    const { default: EdgeLabLandingPage } = await import("@/app/edge-lab/page");
    return <EdgeLabLandingPage />;
  }

  /** Home vitrine Jessica : ne jamais servir Beyond ici, même si les headers tenant sont absents. */
  if (!isLocalhost && isJessicaContentinMarketingHostname(hostname)) {
    const { default: JessicaContentinHomePage } = await import("@/app/jessica-contentin/page");
    const { JessicaContentinLayout } = await import("@/app/jessica-contentin/layout");
    return (
      <JessicaContentinLayout>
        <JessicaContentinHomePage />
      </JessicaContentinLayout>
    );
  }

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

      return <LandingPage tenant={tenant} branding={branding} />;
    }
  }

  // Sinon, page d'accueil Beyond Center (B2B)
  const session = await getSession();
  if (session) {
    const supabase = await getServerClient();
    if (!supabase) {
      redirect("/dashboard");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", session.id)
      .maybeSingle();

    const role = String((profile as any)?.role ?? session.role ?? "")
      .trim()
      .toLowerCase();
    const companyId = ((profile as any)?.company_id as string | null | undefined) ?? null;

    if (role === "admin_hr") {
      redirect(companyId ? "/dashboard/entreprise" : "/dashboard/apprenant");
    }
    if (role === "expert") {
      redirect("/dashboard/expert/interventions");
    }
    if (role === "employee") {
      redirect("/dashboard/salarie");
    }

    redirect("/dashboard");
  }

  return <BeyondSaasLanding />;
}
