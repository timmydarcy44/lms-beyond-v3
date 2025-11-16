import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperAdminStats } from "@/lib/queries/super-admin";

export default async function StatisticsPage() {
  const stats = await getSuperAdminStats();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Statistiques Globales</h1>
        <p className="text-sm text-white/60">
          Vue d'ensemble complète de toutes les métriques du système
        </p>
      </div>

      {/* Métriques Principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-[0.3em]">
              Organisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalOrganizations}</div>
            <p className="mt-1 text-xs text-white/50">{stats.activeOrganizations} actives</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-[0.3em]">
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
            <div className="mt-2 flex gap-4 text-xs text-white/50">
              <span>{stats.totalInstructors} formateurs</span>
              <span>{stats.totalLearners} apprenants</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-[0.3em]">
              Contenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalContent}</div>
            <div className="mt-2 flex gap-4 text-xs text-white/50">
              <span>{stats.totalCourses} formations</span>
              <span>{stats.totalPaths} parcours</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-[0.3em]">
              Activité (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.last24hActivity}</div>
            <p className="mt-1 text-xs text-white/50">Actions récentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Détails par Catégorie */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Répartition des Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Formateurs</span>
              <span className="font-semibold text-white">{stats.totalInstructors}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Apprenants</span>
              <span className="font-semibold text-white">{stats.totalLearners}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Tuteurs</span>
              <span className="font-semibold text-white">{stats.totalTutors}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Répartition des Contenus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Formations</span>
              <span className="font-semibold text-white">{stats.totalCourses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Parcours</span>
              <span className="font-semibold text-white">{stats.totalPaths}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Ressources</span>
              <span className="font-semibold text-white">{stats.totalResources}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Tests</span>
              <span className="font-semibold text-white">{stats.totalTests}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




