import Image from "next/image";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { Button } from "@/components/ui/button";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

const FILTER_TABS = [
  "Tout",
  "Masterclass",
  "Parcours certifiants",
  "Micro-learning",
  "Soft skills",
  "IA & Data",
];

type LearnerCardCollection = Awaited<ReturnType<typeof getApprenantDashboardData>>["formations"];

const filterByCategory = (all: LearnerCardCollection, categoryName: string) => {
  return all.filter((card) => {
    // Utiliser la catégorie si disponible
    if (card.category && card.category === categoryName) {
      return true;
    }
    // Fallback : chercher dans le titre et meta pour compatibilité avec les anciennes formations
    const haystack = `${card.title} ${card.meta ?? ""}`.toLowerCase();
    const categoryLower = categoryName.toLowerCase();
    return haystack.includes(categoryLower);
  });
};

export default async function LearnerFormationsPage() {
  const data = await getApprenantDashboardData();
  const spotlight = data.formations[0] ?? data.continueWatching[0];
  const secondary = data.formations.slice(1, 4);
  const businessFormations = filterByCategory(data.formations, "Business & Sales");
  const rhFormations = filterByCategory(data.formations, "RH & Coaching");
  const marketingFormations = filterByCategory(data.formations, "Marketing & Communication");

  return (
    <DashboardShell
      title="Formations"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Formations" },
      ]}
    >
      <div className="space-y-12">
        <header className="space-y-6">
          <p className="max-w-3xl text-sm text-slate-600 dark:text-white/60">
            Explorez les expériences immersives imaginées par Timmy Darcy. Chaque programme mixe neurosciences, design émotionnel et pédagogie expérientielle pour propulser vos parcours d&apos;apprentissage.
          </p>
        </header>

        {spotlight ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#FF512F]/30 via-[#DD2476]/20 to-transparent p-8 shadow-[0_40px_120px_-40px_rgba(221,36,118,0.45)]">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />
                {spotlight.image ? (
                  <Image
                    src={spotlight.image}
                    alt={spotlight.title}
                    fill
                    className="object-cover object-center opacity-60"
                    sizes="(min-width: 1024px) 60vw, 100vw"
                  />
                ) : null}
              </div>

              <div className="relative flex h-full flex-col justify-between gap-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                    <span>Focus</span>
                    <span className="h-1 w-1 rounded-full bg-white/70" />
                    <span>Signature Timmy Darcy</span>
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{spotlight.title}</h1>
                  {spotlight.meta ? (
                    <p className="text-sm text-white/80">{spotlight.meta}</p>
                  ) : null}
                  <p className="max-w-2xl text-base text-white/70">
                    Créez des expériences neuro-pédagogiques marquantes, avec un accompagnement guidé étape par étape et des rituels prêts à être déployés dans vos sessions.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:opacity-90"
                  >
                    <Link href={spotlight.href}>Démarrer</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="rounded-full border border-white/25 bg-white/10 px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 hover:border-white/40 hover:text-white"
                  >
                    <Link href={`${spotlight.href}#programme`}>Voir le programme</Link>
                  </Button>
                </div>
              </div>
            </article>

            <aside className="space-y-4">
              {secondary.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className="group flex min-h-[140px] flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 transition duration-300 hover:border-slate-300 dark:hover:border-white/30 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/40">
                    <span>{item.meta ?? "Parcours"}</span>
                    <span>{item.cta ?? "Découvrir"}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white">{item.title}</h3>
                </Link>
              ))}
            </aside>
          </section>
        ) : null}

        {data.continueWatching.length > 0 && (
          <SectionSlider title="Continuez votre apprentissage" cards={data.continueWatching as any} accent="learner" />
        )}
        {businessFormations.length > 0 && (
          <SectionSlider title="Business & Sales" cards={businessFormations as any} accent="learner" />
        )}
        {rhFormations.length > 0 && (
          <SectionSlider title="RH & Coaching" cards={rhFormations as any} accent="learner" />
        )}
        {marketingFormations.length > 0 && (
          <SectionSlider title="Marketing & Communication" cards={marketingFormations as any} accent="learner" />
        )}
        {data.ressources.length > 0 && (
          <SectionSlider title="Bibliothèque des ressources" cards={data.ressources as any} accent="learner" />
        )}
      </div>
    </DashboardShell>
  );
}
