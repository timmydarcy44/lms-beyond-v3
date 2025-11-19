import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { LearnerHero } from "@/components/dashboard/learner-hero";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApprenantDashboardPage() {
  console.log("[apprenant/dashboard] rendering page");
  const data = await getApprenantDashboardData();
  console.log("[apprenant/dashboard] parcours", data.parcours.map((p) => ({ id: p.id, slug: p.slug, title: p.title })));
  const session = await getSession();

  console.log("[apprenant/dashboard] parcours count", data.parcours.length);

  return (
    <DashboardShell
      title="Espace apprenant"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Apprenant" },
      ]}
      firstName={session?.fullName ?? null}
      email={session?.email ?? null}
    >
      <LearnerHero hero={data.hero} previews={data.formations.slice(0, 4)} />

      {data.continueWatching.length > 0 && (
        <SectionSlider 
          title="Reprendre" 
          cards={data.continueWatching.map(card => ({ 
            ...card, 
            cta: card.cta ?? undefined,
            meta: card.meta ?? undefined,
            progress: card.progress ?? undefined,
          }))} 
          accent="learner" 
        />
      )}
      {data.parcours.length > 0 && (
        <SectionSlider 
          title="Parcours" 
          cards={data.parcours.map(card => ({ 
            ...card, 
            cta: card.cta ?? undefined,
            meta: card.meta ?? undefined,
            progress: card.progress ?? undefined,
          }))} 
          accent="learner" 
        />
      )}
      {data.formations.length > 0 && (
        <SectionSlider 
          title="Formations" 
          cards={data.formations.map(card => ({ 
            ...card, 
            cta: card.cta ?? undefined,
            meta: card.meta ?? undefined,
            progress: card.progress ?? undefined,
          }))} 
          accent="learner" 
        />
      )}
      {data.ressources.length > 0 && (
        <SectionSlider 
          title="Ressources" 
          cards={data.ressources.map(card => ({ 
            ...card, 
            cta: card.cta ?? undefined,
            meta: card.meta ?? undefined,
            progress: card.progress ?? undefined,
          }))} 
          accent="learner" 
        />
      )}
      {data.tests.length > 0 && (
        <SectionSlider 
          title="Tests" 
          cards={data.tests.map(card => ({ 
            ...card, 
            cta: card.cta ?? undefined,
            meta: card.meta ?? undefined,
            progress: card.progress ?? undefined,
          }))} 
          accent="learner" 
        />
      )}
    </DashboardShell>
  );
}


