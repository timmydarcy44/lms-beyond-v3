import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperAdminStats } from "@/lib/queries/super-admin";

export const dynamic = 'force-dynamic';

export default async function StatisticsPage() {
  const stats = await getSuperAdminStats();

  return (
    <div className="space-y-8">
      {/* Header centré avec gradient */}
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Statistiques Globales
        </h1>
        <p className="text-sm text-gray-600 text-center">
          Vue d'ensemble complète de toutes les métriques du système
        </p>
      </div>

      {/* Métriques Principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Organisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalOrganizations}</div>
            <p className="mt-1 text-xs text-gray-500">{stats.activeOrganizations} actives</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>{stats.totalInstructors} formateurs</span>
              <span>{stats.totalLearners} apprenants</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Contenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalContent}</div>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>{stats.totalCourses} formations</span>
              <span>{stats.totalPaths} parcours</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Activité (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.last24hActivity}</div>
            <p className="mt-1 text-xs text-gray-500">Actions récentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Détails par Catégorie */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Répartition des Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Formateurs</span>
              <span className="font-semibold text-gray-900">{stats.totalInstructors}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Apprenants</span>
              <span className="font-semibold text-gray-900">{stats.totalLearners}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tuteurs</span>
              <span className="font-semibold text-gray-900">{stats.totalTutors}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Répartition des Contenus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Formations</span>
              <span className="font-semibold text-gray-900">{stats.totalCourses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Parcours</span>
              <span className="font-semibold text-gray-900">{stats.totalPaths}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Ressources</span>
              <span className="font-semibold text-gray-900">{stats.totalResources}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tests</span>
              <span className="font-semibold text-gray-900">{stats.totalTests}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

