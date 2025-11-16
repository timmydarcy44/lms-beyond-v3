import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrganizationFullDetails, getOrganizationActivity } from "@/lib/queries/super-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Edit,
  GraduationCap,
  BookOpen,
  FileText,
  Layers,
  Shield,
  Building2,
  Plus,
  Clock,
  Activity,
} from "lucide-react";
import Image from "next/image";
import { OrganizationActions } from "@/components/super-admin/organization-actions";
import { QuickActionsPanel } from "@/components/super-admin/quick-actions-panel";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default async function OrganizationDetailsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  
  console.log("[super-admin] Fetching organization details for orgId:", orgId);
  
  const [orgDetails, activities] = await Promise.all([
    getOrganizationFullDetails(orgId),
    getOrganizationActivity(orgId),
  ]);

  console.log("[super-admin] Organization details result:", orgDetails ? "Found" : "Not found");

  if (!orgDetails) {
    console.error("[super-admin] Organization not found, returning 404");
    notFound();
  }

  const instructors = orgDetails.members.filter((m) => m.role === "instructor");
  const learners = orgDetails.members.filter((m) => m.role === "learner");
  const tutors = orgDetails.members.filter((m) => m.role === "tutor");
  const admins = orgDetails.members.filter((m) => m.role === "admin");

  return (
    <div className="flex gap-0 min-h-screen">
      {/* Sidebar Actions Rapides - Style Apple */}
      <aside className="hidden lg:block w-80 bg-gray-50 border-r border-gray-200">
        <div className="sticky top-0 p-6 h-screen overflow-y-auto">
          <QuickActionsPanel organizationId={orgId} organizationName={orgDetails.name} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 px-8 py-8 max-w-7xl mx-auto space-y-8">
      {/* Header avec logo en cover */}
      <div className="relative h-64 w-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-8">
        {orgDetails.logo ? (
          <Image
            src={orgDetails.logo}
            alt={`${orgDetails.name} logo`}
            fill
            className="object-contain p-8"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building2 className="h-24 w-24 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{orgDetails.name}</h1>
              {orgDetails.slug && (
                <p className="text-sm text-gray-500 font-mono">/{orgDetails.slug}</p>
              )}
              {orgDetails.description && (
                <p className="text-sm text-gray-600 mt-2">{orgDetails.description}</p>
              )}
            </div>
        <div className="flex items-center gap-2">
          <Link href={`/super/organisations/${orgId}/edit`}>
            <Button className="bg-black text-white hover:bg-gray-900">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
          <OrganizationActions organizationId={orgId} />
        </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Total Membres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{orgDetails.memberCount}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-purple-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Administrateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{orgDetails.adminCount}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Formateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{orgDetails.instructorCount}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-green-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Apprenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{orgDetails.learnerCount}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-orange-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Tuteurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{orgDetails.tutorCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Contenus */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Formations */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Formations ({orgDetails.courses.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {orgDetails.courses.length === 0 ? (
              <p className="text-sm text-gray-600">Aucune formation</p>
            ) : (
              <div className="space-y-2">
                {orgDetails.courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/dashboard/formateur/formations/${course.id}`}
                    className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <p className="font-medium text-gray-900">{course.title}</p>
                    <p className="text-xs text-gray-600">
                      {course.status || "Non publié"} • {course.createdAt ? new Date(course.createdAt).toLocaleDateString("fr-FR") : ""}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parcours */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Parcours ({orgDetails.paths.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {orgDetails.paths.length === 0 ? (
              <p className="text-sm text-gray-600">Aucun parcours</p>
            ) : (
              <div className="space-y-2">
                {orgDetails.paths.map((path) => (
                  <Link
                    key={path.id}
                    href={`/dashboard/formateur/parcours/${path.id}`}
                    className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <p className="font-medium text-gray-900">{path.title}</p>
                    <p className="text-xs text-gray-600">
                      {path.status || "Non publié"} • {path.createdAt ? new Date(path.createdAt).toLocaleDateString("fr-FR") : ""}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ressources */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Ressources ({orgDetails.resources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orgDetails.resources.length === 0 ? (
              <p className="text-sm text-gray-600">Aucune ressource</p>
            ) : (
              <div className="space-y-2">
                {orgDetails.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <p className="font-medium text-gray-900">{resource.title}</p>
                    <p className="text-xs text-gray-600">
                      {resource.published ? "Publié" : "Brouillon"} • {resource.kind || "Type inconnu"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tests */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tests ({orgDetails.tests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orgDetails.tests.length === 0 ? (
              <p className="text-sm text-gray-600">Aucun test</p>
            ) : (
              <div className="space-y-2">
                {orgDetails.tests.map((test) => (
                  <Link
                    key={test.id}
                    href={`/dashboard/formateur/tests/${test.id}`}
                    className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <p className="font-medium text-gray-900">{test.title}</p>
                    <p className="text-xs text-gray-600">
                      {test.published ? "Publié" : "Brouillon"} • {test.createdAt ? new Date(test.createdAt).toLocaleDateString("fr-FR") : ""}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membres détaillés */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Administrateurs */}
        {admins.length > 0 && (
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Administrateurs ({admins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {admins.map((admin) => (
                  <Link
                    key={admin.id}
                    href={`/super/utilisateurs/${admin.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{admin.fullName || admin.email}</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      {admin.phone && <p className="text-xs text-gray-500">{admin.phone}</p>}
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formateurs */}
        {instructors.length > 0 && (
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Formateurs ({instructors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {instructors.slice(0, 10).map((instructor) => (
                  <Link
                    key={instructor.id}
                    href={`/super/utilisateurs/${instructor.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{instructor.fullName || instructor.email}</p>
                      <p className="text-sm text-gray-600">{instructor.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                  </Link>
                ))}
                {instructors.length > 10 && (
                  <p className="text-sm text-gray-600 text-center pt-2">
                    +{instructors.length - 10} autres formateurs
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Apprenants */}
        {learners.length > 0 && (
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Apprenants ({learners.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {learners.slice(0, 10).map((learner) => (
                  <Link
                    key={learner.id}
                    href={`/super/utilisateurs/${learner.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{learner.fullName || learner.email}</p>
                      <p className="text-sm text-gray-600">{learner.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                  </Link>
                ))}
                {learners.length > 10 && (
                  <p className="text-sm text-gray-600 text-center pt-2">
                    +{learners.length - 10} autres apprenants
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tuteurs */}
        {tutors.length > 0 && (
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tuteurs ({tutors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tutors.map((tutor) => (
                  <Link
                    key={tutor.id}
                    href={`/super/utilisateurs/${tutor.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{tutor.fullName || tutor.email}</p>
                      <p className="text-sm text-gray-600">{tutor.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activités Récentes */}
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activités Récentes
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Derniers mouvements concernant les formateurs, apprenants, tuteurs et contenus
          </p>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Aucune activité récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const getActivityIcon = () => {
                  switch (activity.type) {
                    case "member_added":
                      return <UserPlus className="h-4 w-4 text-green-600" />;
                    case "course_created":
                    case "course_published":
                      return <GraduationCap className="h-4 w-4 text-blue-600" />;
                    case "path_created":
                    case "path_published":
                      return <Layers className="h-4 w-4 text-purple-600" />;
                    case "resource_created":
                      return <BookOpen className="h-4 w-4 text-orange-600" />;
                    case "test_created":
                      return <FileText className="h-4 w-4 text-red-600" />;
                    default:
                      return <Activity className="h-4 w-4 text-gray-600" />;
                  }
                };

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      {getActivityIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      {activity.subtitle && (
                        <p className="text-xs text-gray-600 mt-0.5">{activity.subtitle}</p>
                      )}
                      {activity.userId && (
                        <Link
                          href={`/super/utilisateurs/${activity.userId}`}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                        >
                          {activity.userName || "Voir le profil"} →
                        </Link>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
