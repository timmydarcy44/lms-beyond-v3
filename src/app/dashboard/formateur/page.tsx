import { DashboardShellWrapper } from "@/components/dashboard/dashboard-shell-wrapper";
import { TasksBanner } from "@/components/dashboard/tasks-banner";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { QuickCreateSlider } from "@/components/admin/QuickCreateSlider";
import { KPIGrid, type KpiCard } from "@/components/admin/KPIGrid";
import { getFormateurDashboardData } from "@/lib/queries/formateur";
import { getSession } from "@/lib/auth/session";

export default async function FormateurDashboardPage() {
  const data = await getFormateurDashboardData();
  const session = await getSession();

  // Log pour debugging
  console.log("[formateur/dashboard] Dashboard data:", {
    activeCourses: data.activeCourses.length,
    recommendedCourses: data.recommendedCourses.length,
    featuredTests: data.featuredTests.length,
    resources: data.resources.length,
    paths: data.paths.length,
    courses: data.activeCourses.map(c => ({ id: c.id, title: c.title, href: c.href })),
  });

  const kpis: KpiCard[] = [
    {
      label: "Apprenants actifs",
      value: data.kpis.totalLearners,
      hint: "+12% vs semaine dernière",
      trend: "up",
    },
    {
      label: "Formations publiées",
      value: data.kpis.activeCourses,
      hint: "Cours en ligne",
      trend: "up",
    },
    {
      label: "Tests en production",
      value: data.kpis.publishedTests,
      hint: "Derniers 30 jours",
      trend: "up",
    },
    {
      label: "Copies à corriger",
      value: data.kpis.pendingReviews,
      hint: "En attente d&apos;évaluation",
      trend: data.kpis.pendingReviews > 5 ? "down" : null,
    },
  ];

  const quickItems = [
    {
      key: "create-course",
      title: "Créer une formation",
      subtitle: "Montez un nouveau curriculum",
      cta: "Lancer l&apos;éditeur",
      image: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80",
      href: "/dashboard/formateur/formations/new",
    },
    {
      key: "build-path",
      title: "Développer un parcours",
      subtitle: "Assemblez une progression immersive",
      cta: "Structurer",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
      href: "/dashboard/formateur/parcours",
    },
    {
      key: "create-test",
      title: "Publier un test",
      subtitle: "Évaluez la progression",
      cta: "Créer",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
      href: "/dashboard/formateur/tests/new",
    },
    {
      key: "share-resource",
      title: "Partager une ressource",
      subtitle: "Ajoutez un support complémentaire",
      cta: "Déposer",
      image: "https://images.unsplash.com/photo-1514970745-474ba6a2b1d8?auto=format&fit=crop&w=900&q=80",
      href: "/dashboard/formateur/ressources",
    },
  ];

  return (
    <DashboardShellWrapper
      title="Espace formateur"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Formateur" },
      ]}
      firstName={session?.fullName ?? null}
      email={session?.email ?? null}
    >
      <TasksBanner roleFilter="instructor" todoHref="/dashboard/formateur/todo" />
      
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#18181b]/90 via-[#11111f]/90 to-[#050505]/80 px-7 py-10 shadow-[0_40px_120px_rgba(59,130,246,0.15)] lg:px-12 lg:py-14 w-full">
        <div className="pointer-events-none absolute -left-28 -top-32 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.45),_transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-[-160px] h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.35),_transparent_65%)] blur-3xl" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/90">
              Espace Formateur
            </p>
            <h1 className="text-3xl font-semibold leading-tight md:text-[36px]">
              Orchestrer vos formations, suivez vos cohortes et boostez l&apos;engagement de vos apprenants.
            </h1>
            <p className="text-sm text-white/75">
              Visualisez instantanément vos indicateurs clés, planifiez vos prochaines sessions et partagez les ressources qui font la différence.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm text-white/70 lg:text-right">
            <span className="rounded-full border border-white/20 px-4 py-2 text-white/80">
              📈 Focus : progression moyenne des cohortes à +8% cette semaine
            </span>
            <div className="flex items-center gap-3">
              <button className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10">
                Exporter le reporting
              </button>
              <button className="rounded-full bg-[linear-gradient(135deg,#00C6FF,#0072FF)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_50px_rgba(0,114,255,0.35)] transition hover:scale-105">
                Inviter un apprenant
              </button>
            </div>
          </div>
        </div>
      </section>

      <KPIGrid kpis={kpis} />

      <QuickCreateSlider items={quickItems} />

      <section className="relative grid gap-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a]/80 via-[#111827]/80 to-[#020617]/80 px-7 py-10 shadow-[0_32px_120px_rgba(29,78,216,0.25)] lg:grid-cols-[1.1fr_1fr] lg:px-12 lg:py-14">
        <div className="space-y-5">
          <span className="inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
            Masterclass vidéo
          </span>
          <h2 className="text-3xl font-semibold leading-tight md:text-[34px]">
            Neurosciences &amp; engagement : des leviers concrets pour transformer vos parcours.
          </h2>
          <p className="max-w-2xl text-sm text-white/75">
            Une immersion de 12 minutes où Timmy Darcy décortique les mécaniques attentionnelles et les rituels d&apos;ancrage. Idéal pour préparer votre prochaine session ou inspirer votre équipe.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 px-5 py-2 text-sm font-semibold text-black shadow-[0_12px_40px_rgba(56,189,248,0.35)] transition hover:scale-105">
              Visionner l&apos;aperçu
            </button>
            <button className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10">
              Consulter le programme
            </button>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_24px_80px_rgba(15,118,110,0.25)]">
          <div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.3),_transparent_70%)] blur-2xl" />
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80"
            className="h-full w-full object-cover"
          >
            <source src="https://cdn.coverr.co/videos/coverr-business-team-in-a-training-session-7020/1080p.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

    </DashboardShellWrapper>
  );
}


