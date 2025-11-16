import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserFullDetails } from "@/lib/queries/super-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Building2, Edit, GraduationCap, BookOpen, FileText, Layers, Shield, Phone } from "lucide-react";
import { UserTestResultsSection } from "./test-results-section";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  
  console.log("[super-admin/page] UserDetailsPage - userId:", userId);
  console.log("[super-admin/page] UserDetailsPage - userId type:", typeof userId);
  console.log("[super-admin/page] UserDetailsPage - userId length:", userId?.length);
  
  const userDetails = await getUserFullDetails(userId);
  
  console.log("[super-admin/page] UserDetailsPage - userDetails:", userDetails ? "Found" : "Not found");

  if (!userDetails) {
    console.error("[super-admin/page] UserDetailsPage - User not found, returning 404");
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link href="/super/utilisateurs">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {userDetails.fullName || userDetails.email}
          </h1>
          <p className="text-sm text-gray-600">{userDetails.email}</p>
        </div>
        <Link href={`/super/utilisateurs/${userId}/edit`}>
          <Button className="bg-black text-white hover:bg-gray-900">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </Link>
      </div>

      {/* Informations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Email</p>
              <p className="text-gray-900 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                {userDetails.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Nom complet</p>
              <p className="text-gray-900">{userDetails.fullName || "Non renseigné"}</p>
            </div>
            {userDetails.phone && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Téléphone</p>
                <p className="text-gray-900 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {userDetails.phone}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Rôle</p>
              <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 capitalize">
                {userDetails.role === "instructor" ? "Formateur" : userDetails.role === "learner" ? "Apprenant" : userDetails.role === "admin" ? "Administrateur" : userDetails.role === "tutor" ? "Tuteur" : userDetails.role}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-purple-50/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organisations ({userDetails.organizations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userDetails.organizations.length === 0 ? (
              <p className="text-sm text-gray-600">Aucune organisation</p>
            ) : (
              <div className="space-y-2">
                {userDetails.organizations.map((org) => (
                  <Link
                    key={org.id}
                    href={`/super/organisations/${org.id}`}
                    className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-600 capitalize">{org.role}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contenus créés par l'utilisateur */}
      {(userDetails.courses.length > 0 || userDetails.paths.length > 0 || userDetails.resources.length > 0 || userDetails.tests.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Formations */}
          {userDetails.courses.length > 0 && (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Formations ({userDetails.courses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userDetails.courses.map((course) => (
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
              </CardContent>
            </Card>
          )}

          {/* Parcours */}
          {userDetails.paths.length > 0 && (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Parcours ({userDetails.paths.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userDetails.paths.map((path) => (
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
              </CardContent>
            </Card>
          )}

          {/* Ressources */}
          {userDetails.resources.length > 0 && (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Ressources ({userDetails.resources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userDetails.resources.map((resource) => (
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
              </CardContent>
            </Card>
          )}

          {/* Tests */}
          {userDetails.tests.length > 0 && (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tests ({userDetails.tests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userDetails.tests.map((test) => (
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
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Message si aucun contenu */}
      {userDetails.courses.length === 0 && userDetails.paths.length === 0 && userDetails.resources.length === 0 && userDetails.tests.length === 0 && (
        <Card className="border-gray-200 bg-gradient-to-br from-white to-gray-50/30 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Aucun contenu créé</p>
            <p className="text-sm text-gray-600">
              Cet utilisateur n'a pas encore créé de formations, parcours, ressources ou tests.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Section Résultats de tests */}
      <UserTestResultsSection userId={userId} />
    </div>
  );
}
