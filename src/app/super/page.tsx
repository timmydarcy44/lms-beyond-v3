import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperAdminStats, getTrends, getTopPerformers } from "@/lib/queries/super-admin";
import { getTrainingSectorNews } from "@/lib/queries/news";
import { Building2, Users, Activity, Plus, ChevronRight, ExternalLink, Newspaper, TrendingUp, Award, AlertTriangle, Target, Clock, CheckCircle2, Globe, BookOpen, Store } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendChart } from "@/components/super-admin/trend-chart";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BTOB_CATALOGUE_STAGE_SLUG } from "@/lib/crm/pipeline-shared";
import { getPipelineBtobSummary } from "@/lib/crm/pipeline-btob-mcp";

export default async function SuperDashboard() {
  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login");
  }
  const { data: { user } } = await supabase.auth.getUser();
  const isContentin = user?.email === "contentin.cabinet@gmail.com";

  // Rediriger Jessica vers son dashboard spécifique
  if (isContentin) {
    redirect("/super/jessica-dashboard");
  }

  const [stats, news, trends30d, topPerformers, pipelineSummary, catalogueCount] = await Promise.all([
    getSuperAdminStats(),
    getTrainingSectorNews(),
    getTrends("30d"),
    getTopPerformers(),
    getPipelineBtobSummary().catch(() => null),
    (async () => {
      const service = getServiceRoleClient();
      if (!service) return 0;
      const { count } = await service
        .from("crm_pipeline_deals")
        .select("*", { count: "exact", head: true })
        .eq("pipeline_type", "btob")
        .eq("stage_slug", BTOB_CATALOGUE_STAGE_SLUG);
      return count ?? 0;
    })(),
  ]);

  type QuickAction = {
    title: string;
    description: string;
    href: string;
    image: string;
    icon: typeof Building2;
    color: string;
    category?: string;
  };

  // Actions rapides pour contentin.cabinet@gmail.com
  const contentinQuickActions: QuickAction[] = [
    {
      title: "Créer une formation",
      description: "Créer une nouvelle formation pour votre catalogue",
      href: "/super/studio/modules/new/choose",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
      icon: BookOpen,
      color: "from-blue-500/20 via-blue-400/30 to-transparent",
    },
    {
      title: "Mon catalogue",
      description: "Gérer et visualiser votre catalogue de formations",
      href: "/super/catalogue",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
      icon: Store,
      color: "from-purple-500/20 via-purple-400/30 to-transparent",
    },
    {
      title: "Gérer mon site",
      description: "Personnaliser le site jessica-contentin.fr",
      href: "/super/pages",
      image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80",
      icon: Globe,
      color: "from-green-500/20 via-green-400/30 to-transparent",
    },
  ];

  // Actions rapides pour les autres super admins
  const defaultQuickActions: QuickAction[] = [
    {
      title: "Pipeline commercial",
      description: "Kanban ventes : A appeler → Proposition → Réussi",
      href: "/super/crm/pipeline",
      image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
      icon: Users,
      category: "CRM",
      color: "from-cyan-500/20 via-cyan-400/30 to-transparent",
    },
    {
      title: "CRM — Contacts",
      description: "Parcourir et filtrer tous les contacts (style pipeline)",
      href: "/super/utilisateurs",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
      icon: Users,
      category: "CRM",
      color: "from-green-500/20 via-green-400/30 to-transparent",
    },
    {
      title: "Emails (Resend)",
      description: "Envoyer un email à tous les contacts, un segment ou une personne",
      href: "/super/crm/emails",
      image: "https://images.unsplash.com/photo-1557201102-c0fbee6bfe05?w=800&q=80",
      icon: Users,
      category: "CRM",
      color: "from-orange-500/20 via-orange-400/30 to-transparent",
    },
    {
      title: "Gérer les Open Badges",
      description: "Créer des badges, définir critères, suivre les demandes et émettre.",
      href: "/super/open-badges/badgeclasses",
      image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80",
      icon: Award,
      category: "Certifications",
      color: "from-amber-500/20 via-amber-400/30 to-transparent",
    },
  ];

  const quickActions = isContentin ? contentinQuickActions : defaultQuickActions;

  return (
    <div className="space-y-8">
      {/* Header centré avec gradient */}
      <div className="flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-center justify-center space-y-2 md:items-start">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 text-center md:text-left">
            {isContentin ? "Gestion de votre catalogue et de votre site" : "Vue d'ensemble du système"}
          </p>
        </div>

        {!isContentin && (
          <div className="w-full md:w-[420px]">
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-indigo-50/40 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Synthèse commerciale</p>
                  <p className="mt-1 text-sm text-gray-700">Pipeline BTOB</p>
                </div>
                {catalogueCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                    {catalogueCount} à relancer
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
                    OK
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Prospects</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{pipelineSummary?.total ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Aujourd’hui</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{pipelineSummary?.actions_today ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Retard</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{pipelineSummary?.actions_overdue ?? "—"}</p>
                </div>
              </div>

              {catalogueCount > 0 ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-900">
                    Alertes “Mail envoyé + catalogue”
                  </p>
                  <p className="mt-1 text-xs text-amber-900/80">
                    {catalogueCount} prospect(s) sont à cette étape.
                  </p>
                  <div className="mt-2">
                    <Link href="/super/crm/pipeline" className="text-xs font-semibold text-amber-900 underline">
                      Ouvrir le pipeline
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Actions Rapides - Style Apple */}
      <div className={`grid gap-4 ${isContentin ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}>
        {quickActions.map((action) => {
          return (
            <Link key={action.href} href={action.href}>
              <div className="group relative h-[400px] overflow-hidden rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                {/* Image de fond */}
                <div className="absolute inset-0">
                  <Image
                    src={action.image}
                    alt={action.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Overlay sombre pour la lisibilité du texte */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                </div>

                {/* Contenu texte superposé - style Apple */}
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
                  {/* Badge discret en haut */}
                  <div className="mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-white/70">
                      {action.category ??
                        (action.title.includes("Organisation")
                          ? "Organisation"
                          : action.title.includes("Administrateur")
                            ? "Administration"
                            : "Utilisateurs")}
                    </span>
                  </div>
                  {/* Titre principal - style Apple */}
                  <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                    {action.title}
                  </h3>
                  {/* Description - style Apple */}
                  <p className="text-sm text-white/90 leading-relaxed mb-4">
                    {action.description}
                  </p>
                  {/* Bouton + style Apple */}
                  <div className="flex items-center justify-end">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all group-hover:bg-black/60">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* KPI Cards - Métriques de Base - Masquer pour contentin */}
      {!isContentin && (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent">
              {stats.totalOrganizations}
            </div>
            <p className="mt-1 text-xs text-gray-500">{stats.activeOrganizations} actives</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-purple-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-700 bg-clip-text text-transparent">
              {stats.totalUsers}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>{stats.totalInstructors} formateurs</span>
              <span>{stats.totalLearners} apprenants</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-green-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Contenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
              {stats.totalContent}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>{stats.totalCourses} formations</span>
              <span>{stats.totalPaths} parcours</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-orange-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activité (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-orange-700 bg-clip-text text-transparent">
              {stats.last24hActivity}
            </div>
            <p className="mt-1 text-xs text-gray-500">Actions récentes</p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Métriques Enrichies - Engagement & Performance - Masquer pour contentin */}
      {!isContentin && (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Rétention (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.retentionRates.day30.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {stats.retentionRates.day7.toFixed(1)}% (7j) • {stats.retentionRates.day90.toFixed(1)}% (90j)
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-green-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complétion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completionMetrics.courses.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Formations • {stats.completionMetrics.paths.toFixed(1)}% parcours
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-purple-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Session Moy.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(stats.engagementMetrics.avgSessionDuration)}
            </div>
            <p className="mt-1 text-xs text-gray-500">minutes</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-cyan-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Actifs (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {stats.engagementMetrics.activeUsers30d}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {stats.engagementMetrics.activeUsers7d} actifs (7j)
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              Risque Churn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.churnRisk.inactiveUsers30d}
            </div>
            <p className="mt-1 text-xs text-gray-500">utilisateurs inactifs</p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Graphiques de Tendances - Masquer pour contentin */}
      {!isContentin && (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Évolution (30 jours)</h2>
            <p className="text-sm text-gray-600 mt-1">Croissance des organisations, utilisateurs et contenus</p>
          </div>
        </div>
        <TrendChart data={trends30d} title="Évolution du Système" timeRange="30d" />
      </div>
      )}

      {/* Top Performers - Masquer pour contentin */}
      {!isContentin && (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Organisations
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Par nombre de membres</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.organizations.slice(0, 5).map((org, index) => (
                <div key={org.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-400 w-4">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{org.name}</span>
                  </div>
                  <span className="text-xs text-gray-600 ml-2">{org.metric} {org.metricLabel}</span>
                </div>
              ))}
              {topPerformers.organizations.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Top Formations
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Par taux de complétion</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.courses.slice(0, 5).map((course, index) => (
                <div key={course.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-400 w-4">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-900 truncate" title={course.name}>{course.name}</span>
                  </div>
                  <span className="text-xs text-gray-600 ml-2">{course.metric}%</span>
                </div>
              ))}
              {topPerformers.courses.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Top Parcours
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Par taux de complétion</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.paths.slice(0, 5).map((path, index) => (
                <div key={path.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-400 w-4">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-900 truncate" title={path.name}>{path.name}</span>
                  </div>
                  <span className="text-xs text-gray-600 ml-2">{path.metric}%</span>
                </div>
              ))}
              {topPerformers.paths.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Top Formateurs
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Par contenus créés</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.instructors.slice(0, 5).map((instructor, index) => (
                <div key={instructor.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-400 w-4">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-900 truncate" title={instructor.name}>{instructor.name}</span>
                  </div>
                  <span className="text-xs text-gray-600 ml-2">{instructor.metric}</span>
                </div>
              ))}
              {topPerformers.instructors.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Organisations Récentes - Style Apple - Masquer pour contentin */}
      {!isContentin && (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Organisations Récentes</h2>
            <p className="text-sm text-gray-600 mt-1">Coup d'œil sur les dernières organisations créées</p>
          </div>
          <Link href="/super/organisations" className="text-gray-600 hover:text-gray-900 transition">
            <span className="text-sm font-medium">Voir tout →</span>
          </Link>
        </div>

        {/* Scroll horizontal des organisations */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {stats.recentOrganizations.map((org, index) => {
              // Images placeholder variées pour chaque organisation
              const placeholderImages = [
                "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80",
                "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
                "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
                "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80",
                "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
                "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
              ];
              const imageUrl = placeholderImages[index % placeholderImages.length];
              
              return (
                <Link
                  key={org.id}
                  href={`/super/organisations/${org.id}`}
                  className="group flex-shrink-0 w-[380px] h-[520px] rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                >
                  <div className="relative h-full flex flex-col">
                    {/* Image de fond */}
                    <div className="absolute inset-0">
                      <Image
                        src={imageUrl}
                        alt={org.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>

                    {/* Gradient overlay pour lisibilité du texte */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

                    {/* Contenu texte en haut */}
                    <div className="relative flex flex-col justify-end h-full p-8 text-white z-10">
                      <h3 className="text-4xl font-bold mb-2 leading-tight">{org.name}</h3>
                      {org.slug && (
                        <p className="text-lg text-gray-300 mb-6">/{org.slug}</p>
                      )}
                      <div className="space-y-3 text-sm">
                        <p className="text-gray-300">
                          {org.memberCount} membre{org.memberCount !== 1 ? "s" : ""}
                        </p>
                        {org.createdAt && (
                          <p className="text-gray-400 text-xs">
                            Créée le {new Date(org.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Actualités du Secteur de la Formation - Slider - Masquer pour contentin */}
      {!isContentin && (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Actualités du Secteur</h2>
            <p className="text-sm text-gray-600 mt-1">Les dernières tendances et informations sur la formation professionnelle</p>
          </div>
        </div>

        {/* Slider horizontal des actualités */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-shrink-0 w-[380px] rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300"
              >
                {item.imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {item.source}
                    </span>
                    <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(item.publishedAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-blue-600 group-hover:text-blue-800">
                      Lire l'article <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
