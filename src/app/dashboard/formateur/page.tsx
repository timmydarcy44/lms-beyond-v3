import { Clock } from "lucide-react";

import { DashboardShellWrapper } from "@/components/dashboard/dashboard-shell-wrapper";
import { TasksBanner } from "@/components/dashboard/tasks-banner";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { QuickCreateSlider } from "@/components/admin/QuickCreateSlider";
import { KPIGrid, type KpiCard } from "@/components/admin/KPIGrid";
import { getFormateurDashboardData } from "@/lib/queries/formateur";
import { getSession } from "@/lib/auth/session";

const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

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
      label: "Apprenants inscrits",
      value: data.kpis.totalLearners,
      hint: "Inclut l’ensemble de vos cohortes",
      trend: "up",
    },
    {
      label: "Formations publiées",
      value: data.kpis.publishedCourses,
      hint: "Cours actuellement visibles",
      trend: "up",
    },
    {
      label: "Tests en production",
      value: data.kpis.publishedTests,
      hint: "Questionnaires activés",
      trend: "up",
    },
    {
      label: "Ressources publiées",
      value: data.kpis.publishedResources,
      hint: "Documents & masterclass disponibles",
      trend: "up",
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
      
      <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_65%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.28),_transparent_60%),linear-gradient(140deg,#080810,#111123,#050508)] px-7 py-12 shadow-[0_45px_140px_-60px_rgba(56,189,248,0.45)] lg:px-12 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_40%)] opacity-60" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/85">
              Espace formateur
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-medium tracking-[0.4em] text-emerald-200">
                Premium
              </span>
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-[38px]">
              Orchestrer vos formations, suivez vos cohortes et boostez l&apos;engagement de vos apprenants.
            </h1>
            <p className="max-w-2xl text-base text-white/80">
              Visualisez d&apos;un coup d&apos;œil vos indicateurs clés, planifiez vos prochaines sessions et partagez les ressources qui créent des expériences mémorables.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#60a5fa] via-[#38bdf8] to-[#2dd4bf] px-6 py-2.5 text-sm font-semibold text-black shadow-[0_18px_60px_-35px_rgba(56,189,248,0.6)] transition hover:scale-105 hover:shadow-[0_25px_70px_-35px_rgba(45,212,191,0.45)]">
                Inviter un apprenant
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10">
                Exporter le reporting
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 transition hover:bg-white/10">
                Planifier une session
              </button>
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/4 p-6 backdrop-blur-lg">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Prochaines étapes
            </span>
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <div>
                  <p className="font-medium text-white">Finaliser votre prochaine cohorte</p>
                  <p className="text-xs text-white/60">3 sections à confirmer</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
                  10 min
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <div>
                  <p className="font-medium text-white">Partager la masterclass engageante</p>
                  <p className="text-xs text-white/60">Embed recommandée pour vos mentors</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
                  5 min
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/75">
              📈 Focus : progression moyenne des cohortes +8% cette semaine
            </span>
          </div>
        </div>
      </section>

      <KPIGrid kpis={kpis} />

      <QuickCreateSlider items={quickItems} />

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a]/85 via-[#111827]/85 to-[#020617]/85 px-7 py-8 shadow-[0_32px_120px_-60px_rgba(59,130,246,0.45)] lg:px-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10">
              <Clock className="h-4 w-4 text-white/80" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">
                Timeline pédagogique
              </p>
              <h3 className="text-xl font-semibold text-white">Historique des actions</h3>
            </div>
          </div>
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
            {data.activityLogs.length}
          </span>
        </div>
        <div className="space-y-4">
          {data.activityLogs.length > 0 ? (
            data.activityLogs.slice(0, 8).map((log) => {
              const metadata = log.metadata as Record<string, unknown>;
              const courseTitle =
                typeof metadata?.course_title === "string" ? metadata.course_title : null;
              const learnerName =
                typeof metadata?.learner_name === "string" ? metadata.learner_name : null;

              let description = log.summary;
              if (!description) {
                switch (log.actionType) {
                  case "course_published":
                    description = `Publication d’une formation${courseTitle ? ` : ${courseTitle}` : ""}`;
                    break;
                  case "test_published":
                    description = `Mise en ligne d’un test${courseTitle ? ` : ${courseTitle}` : ""}`;
                    break;
                  case "resource_added":
                    description = "Nouvelle ressource partagée";
                    break;
                  case "learner_login":
                    description = `Connexion de ${learnerName ?? "un apprenant"}`;
                    break;
                  default:
                    description = `Action ${log.actionType}`;
                }
              }

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white/80"
                >
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{description}</p>
                    {courseTitle ? (
                      <p className="text-xs text-white/60">Formation : {courseTitle}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-white/60">{formatRelativeTime(log.createdAt)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-white/60">
              Les prochaines actions apparaîtront ici dès que vos équipes publient un contenu ou qu’un apprenant interagit avec la plateforme.
            </div>
          )}
        </div>
      </section>

    </DashboardShellWrapper>
  );
}


