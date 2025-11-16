import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperAdminAlerts } from "@/lib/queries/alerts";
import { AlertTriangle, Info, AlertCircle, Building2, Users, GraduationCap } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default async function AlertsPage() {
  const alerts = await getSuperAdminAlerts();

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === "high") {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
    if (type === "warning") {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
    return <Info className="h-5 w-5 text-blue-600" />;
  };

  const getSeverityBadge = (severity: string) => {
    const styles = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return styles[severity as keyof typeof styles] || styles.low;
  };

  const getEntityIcon = (entityType?: string) => {
    switch (entityType) {
      case "organization":
        return <Building2 className="h-4 w-4 text-gray-500" />;
      case "user":
        return <Users className="h-4 w-4 text-gray-500" />;
      case "course":
      case "path":
        return <GraduationCap className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getEntityLink = (alert: { entityId?: string; entityType?: string }) => {
    if (!alert.entityId || !alert.entityType) return null;
    
    switch (alert.entityType) {
      case "organization":
        return `/super/organisations/${alert.entityId}`;
      case "user":
        return `/super/utilisateurs/${alert.entityId}`;
      case "course":
        return `/dashboard/formateur/formations/${alert.entityId}`;
      case "path":
        return `/dashboard/formateur/parcours/${alert.entityId}`;
      default:
        return null;
    }
  };

  const highAlerts = alerts.filter(a => a.severity === "high");
  const mediumAlerts = alerts.filter(a => a.severity === "medium");
  const lowAlerts = alerts.filter(a => a.severity === "low");

  return (
    <div className="space-y-8">
      {/* Header centré avec gradient */}
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Alertes
        </h1>
        <p className="text-sm text-gray-600 text-center">
          Surveillez les points d'attention et les opportunités d'optimisation
        </p>
      </div>

      {/* Résumé des alertes */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-800 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertes Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{highAlerts.length}</div>
            <p className="mt-1 text-xs text-red-700">Nécessitent une action immédiate</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-800 uppercase tracking-wide flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Alertes Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{mediumAlerts.length}</div>
            <p className="mt-1 text-xs text-yellow-700">Requièrent votre attention</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 uppercase tracking-wide flex items-center gap-2">
              <Info className="h-4 w-4" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{lowAlerts.length}</div>
            <p className="mt-1 text-xs text-blue-700">Points d'attention mineurs</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des alertes */}
      {alerts.length === 0 ? (
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Aucune alerte</p>
            <p className="text-sm text-gray-600">Tout fonctionne correctement !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {highAlerts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Critiques ({highAlerts.length})</h2>
              <div className="space-y-3">
                {highAlerts.map((alert) => {
                  const entityLink = getEntityLink(alert);
                  const content = (
                    <Card key={alert.id} className="border-red-200 bg-red-50/30 hover:bg-red-50/50 transition">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {getAlertIcon(alert.type, alert.severity)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{alert.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityBadge(alert.severity)}`}>
                                    {alert.severity === "high" ? "Critique" : alert.severity === "medium" ? "Important" : "Info"}
                                  </span>
                                  {alert.entityType && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      {getEntityIcon(alert.entityType)}
                                      <span className="capitalize">{alert.entityType === "course" ? "Formation" : alert.entityType === "organization" ? "Organisation" : alert.entityType === "user" ? "Utilisateur" : alert.entityType}</span>
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: fr })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );

                  return entityLink ? (
                    <Link key={alert.id} href={entityLink}>
                      {content}
                    </Link>
                  ) : (
                    content
                  );
                })}
              </div>
            </div>
          )}

          {mediumAlerts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Importantes ({mediumAlerts.length})</h2>
              <div className="space-y-3">
                {mediumAlerts.map((alert) => {
                  const entityLink = getEntityLink(alert);
                  const content = (
                    <Card key={alert.id} className="border-yellow-200 bg-yellow-50/30 hover:bg-yellow-50/50 transition">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {getAlertIcon(alert.type, alert.severity)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{alert.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityBadge(alert.severity)}`}>
                                    Important
                                  </span>
                                  {alert.entityType && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      {getEntityIcon(alert.entityType)}
                                      <span className="capitalize">{alert.entityType === "course" ? "Formation" : alert.entityType === "organization" ? "Organisation" : alert.entityType === "user" ? "Utilisateur" : alert.entityType}</span>
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: fr })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );

                  return entityLink ? (
                    <Link key={alert.id} href={entityLink}>
                      {content}
                    </Link>
                  ) : (
                    content
                  );
                })}
              </div>
            </div>
          )}

          {lowAlerts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informations ({lowAlerts.length})</h2>
              <div className="space-y-3">
                {lowAlerts.map((alert) => {
                  const entityLink = getEntityLink(alert);
                  const content = (
                    <Card key={alert.id} className="border-blue-200 bg-blue-50/30 hover:bg-blue-50/50 transition">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {getAlertIcon(alert.type, alert.severity)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{alert.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityBadge(alert.severity)}`}>
                                    Info
                                  </span>
                                  {alert.entityType && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      {getEntityIcon(alert.entityType)}
                                      <span className="capitalize">{alert.entityType === "course" ? "Formation" : alert.entityType === "organization" ? "Organisation" : alert.entityType === "user" ? "Utilisateur" : alert.entityType}</span>
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: fr })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );

                  return entityLink ? (
                    <Link key={alert.id} href={entityLink}>
                      {content}
                    </Link>
                  ) : (
                    content
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




