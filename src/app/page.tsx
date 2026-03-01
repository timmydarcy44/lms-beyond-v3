import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/tenant/landing-page";
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

  return {};
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

  // Sinon, comportement par défaut (Landing Particuliers)
  const session = await getSession();
  if (session) {
    redirect("/dashboard/profil");
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-[14px] font-semibold tracking-[0.3em] text-white">BEYOND</div>
        <Link
          href="/login"
          className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-white/70 hover:border-white/30 hover:text-white"
        >
          Se connecter
        </Link>
      </header>

      <section className="relative overflow-hidden px-6 pb-20 pt-10 sm:px-12 lg:px-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,0,0.2),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl space-y-8">
          <p className="text-[12px] uppercase tracking-[0.4em] text-white/50">Particuliers</p>
          <h1 className="text-pretty text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Certifiez vos Soft Skills. Propulsez votre carrière.
          </h1>
          <p className="max-w-2xl text-lg text-white/70">
            Passez le test DISC, obtenez vos badges blockchain et devenez visible auprès des meilleurs recruteurs.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-[#FF6B00] px-6 py-3 text-[13px] font-semibold text-[#111827] shadow-[0_0_30px_rgba(255,107,0,0.35)] transition hover:shadow-[0_0_45px_rgba(255,107,0,0.6)]"
            >
              Commencer mon test gratuit
            </Link>
            <Link href="/login" className="text-[12px] text-white/70 hover:text-white">
              J&apos;ai déjà un compte →
            </Link>
          </div>
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "DISC Gratuit",
                  desc: "Identifiez votre profil comportemental en 6 minutes.",
                },
                {
                  title: "Badges Blockchain",
                  desc: "Certifications vérifiables pour valoriser votre parcours.",
                },
                {
                  title: "Matching IA",
                  desc: "Visibilité instantanée auprès des recruteurs pertinents.",
                },
              ].map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="text-[14px] font-semibold text-white">{feature.title}</div>
                  <p className="mt-2 text-[12px] text-white/60">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-[12px] text-white/60">
            Utilisé par les étudiants d&apos;Alésia et +20 CFA
          </div>
        </div>
      </section>
    </main>
  );
}
