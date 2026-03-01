import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CinematicHero } from "@/components/dashboard/cinematic-hero";
import { SectionSlider } from "../../../components/dashboard/section-slider";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

type LearnerCardCollection = Awaited<ReturnType<typeof getApprenantDashboardData>>["formations"];

const filterByCategory = (all: LearnerCardCollection, categoryName: string) =>
  all.filter((card) => {
    if (card.category && card.category === categoryName) return true;

    const haystack = `${card.title} ${card.meta ?? ""}`.toLowerCase();
    return haystack.includes(categoryName.toLowerCase());
  });

export default async function LearnerFormationsPage() {
  const data = await getApprenantDashboardData();
  const spotlight = data.formations[0] ?? data.continueWatching[0];
  const secondary = data.formations.slice(1, 4);
  const businessFormations = filterByCategory(data.formations, "Business & Sales");
  const rhFormations = filterByCategory(data.formations, "RH & Coaching");
  const marketingFormations = filterByCategory(data.formations, "Marketing & Communication");

  const activeItems = data.continueWatching.length > 0 ? data.continueWatching : data.formations;
  const activeCount = activeItems.length;
  const averageProgress =
    activeCount > 0
      ? Math.round(
          activeItems.reduce(
            (acc, card) => acc + Math.max(0, Math.min(card.progress ?? 0, 100)),
            0,
          ) / activeCount,
        )
      : 0;
  const completedCount = data.formations.filter((card) => (card.progress ?? 0) >= 99).length;

  const stats = [
    { label: "Catalogue", value: `${data.formations.length}` },
    { label: "Cours actifs", value: `${activeCount}` },
    { label: "Progression moyenne", value: `${averageProgress}%` },
    { label: "Terminés", value: `${completedCount}` },
  ];

  const hero = {
    title: spotlight?.title ?? "Explorez nos formations premium",
    description:
      spotlight?.meta ??
      "Créez des expériences neuro-pédagogiques marquantes avec des parcours scénarisés et des rituels prêts à déployer.",
    badge: spotlight ? "Focus • Signature Timmy Darcy" : "Catalogue Beyond",
    backgroundImage: spotlight?.image ?? null,
    meta: "Formations",
    tags: ["Formations", "Catalogue"],
  };

  return (
    <DashboardShell
      title=""
      breadcrumbs={[]}
      forcedTheme="dark"
      className="bg-[#050505] text-white"
      mainClassName="bg-transparent"
    >
      <CinematicHero
        hero={hero}
        featured={data.formations}
        stats={stats}
        activeHref="/dashboard/formations"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-20 pt-12 md:px-10">
        {secondary.length ? (
          <SectionSlider
            title="Sélection à (re)découvrir"
            cards={secondary as any}
            accent="learner"
            theme="dark"
            variant="compact"
          />
        ) : null}

        <div className="flex flex-col gap-10">
          {data.continueWatching.length > 0 ? (
            <SectionSlider
              title="Continuez votre apprentissage"
              cards={data.continueWatching as any}
              accent="learner"
              theme="dark"
            variant="compact"
            />
          ) : null}
          {businessFormations.length > 0 ? (
            <SectionSlider
              title="Business & Sales"
              cards={businessFormations as any}
              accent="learner"
              theme="dark"
            variant="compact"
            />
          ) : null}
          {rhFormations.length > 0 ? (
            <SectionSlider
              title="RH & Coaching"
              cards={rhFormations as any}
              accent="learner"
              theme="dark"
            variant="compact"
            />
          ) : null}
          {marketingFormations.length > 0 ? (
            <SectionSlider
              title="Marketing & Communication"
              cards={marketingFormations as any}
              accent="learner"
              theme="dark"
            variant="compact"
            />
          ) : null}
          {data.ressources.length > 0 ? (
            <SectionSlider
              title="Bibliothèque des ressources"
              cards={data.ressources as any}
              accent="learner"
              theme="dark"
            variant="compact"
            />
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}

