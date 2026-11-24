import { notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { isHandicapPortfolioOnlyRoleType } from "@/lib/auth/school-role-type-guards";
import { BtocClientFileView } from "@/components/control/btoc-client-file";
import { isBtocRole, loadBtocClientFile } from "@/lib/control/btoc-client-file";
import { getUserFullDetails } from "@/lib/queries/super-admin";
import { getLearnerDossier } from "@/lib/queries/learner-dossier";
import { LearnerDossierPanel } from "@/components/super-admin/learner-dossier-panel";
import Link from "next/link";
import { ArrowLeft, User, Mail, Building2, Edit, GraduationCap, BookOpen, FileText, Layers, Phone, Calendar, Clock, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  if (!(await isSuperAdmin())) {
    notFound();
  }

  const service = getServiceRoleClient();
  if (service) {
    let { data: roleRow } = await service
      .from("profiles")
      .select("role, role_type")
      .eq("id", userId)
      .maybeSingle();

    // Répare les créations CRM B2C restées en learner sans role_type (absents de Client BtoC).
    if (
      roleRow &&
      !isBtocRole(
        (roleRow as { role?: string }).role,
        (roleRow as { role_type?: string | null }).role_type,
      )
    ) {
      try {
        const { data: authUser } = await service.auth.admin.getUserById(userId);
        const meta = (authUser.user?.user_metadata ?? {}) as Record<string, unknown>;
        const metaRole = String(meta.role ?? "");
        const metaRoleType = String(meta.role_type ?? "").toLowerCase();
        const source = String(meta.signup_source ?? "");
        const looksBtoc =
          metaRoleType === "particulier" ||
          metaRoleType === "btoc" ||
          ["PARTICULIER", "particulier", "btoc"].includes(metaRole) ||
          source === "crm_btoc" ||
          (source === "crm_edge" && ["PARTICULIER", "particulier", "btoc"].includes(metaRole));
        if (looksBtoc) {
          await service
            .from("profiles")
            .update({ role_type: "particulier" })
            .eq("id", userId);
          ({ data: roleRow } = await service
            .from("profiles")
            .select("role, role_type")
            .eq("id", userId)
            .maybeSingle());
        }
      } catch {
        /* ignore */
      }
    }

    if (
      isBtocRole(
        (roleRow as { role?: string } | null)?.role,
        (roleRow as { role_type?: string } | null)?.role_type,
      )
    ) {
      const staff = await getServerClient();
      const { data: staffAuth } = await staff.auth.getUser();
      let canViewAdaptation = true; // page réservée super admin
      if (staffAuth.user) {
        const { data: staffProfile } = await service
          .from("profiles")
          .select("role_type")
          .eq("id", staffAuth.user.id)
          .maybeSingle();
        // Super admin : OK. Si un jour d'autres rôles voient la page, masquer sauf RP handicap.
        canViewAdaptation =
          (await isSuperAdmin()) ||
          isHandicapPortfolioOnlyRoleType((staffProfile as { role_type?: string } | null)?.role_type);
      }

      const btoc = await loadBtocClientFile(service, userId, { canViewAdaptation });
      if (!btoc) notFound();
      return <BtocClientFileView initial={btoc} />;
    }
  }

  const [userDetails, dossier] = await Promise.all([
    getUserFullDetails(userId),
    getLearnerDossier(userId),
  ]);

  if (!userDetails) {
    notFound();
  }

  function formatTrackingDate(value: string | null): string {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link href="/super/utilisateurs">
            <Button variant="ghost" size="sm" className="mb-4 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
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
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <User className="h-5 w-5" />
              Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="mb-1 text-xs text-[#9AA3BD]">Email</p>
              <p className="flex items-center gap-2 text-gray-900">
                <Mail className="h-4 w-4 text-gray-500" />
                {userDetails.email}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-[#9AA3BD]">Nom complet</p>
              <p className="text-gray-900">{userDetails.fullName || "Non renseigné"}</p>
            </div>
            {userDetails.phone ? (
              <div>
                <p className="mb-1 text-xs text-[#9AA3BD]">Téléphone</p>
                <p className="flex items-center gap-2 text-gray-900">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {userDetails.phone}
                </p>
              </div>
            ) : null}
            <div>
              <p className="mb-1 text-xs text-[#9AA3BD]">Rôle</p>
              <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                {userDetails.role}
              </span>
            </div>
            <div>
              <p className="mb-1 text-xs text-[#9AA3BD]">Création du compte</p>
              <p className="flex items-center gap-2 text-gray-900">
                <Calendar className="h-4 w-4 text-gray-500" />
                {userDetails.createdAt ? formatTrackingDate(userDetails.createdAt) : "—"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-[#9AA3BD]">Dernière connexion</p>
              <p className="flex items-center gap-2 text-gray-900">
                <Clock className="h-4 w-4 text-gray-500" />
                {userDetails.lastSignInAt ? formatTrackingDate(userDetails.lastSignInAt) : "Jamais connecté"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-[#9AA3BD]">Quiz / tests réalisés</p>
              <p className="flex items-center gap-2 text-gray-900">
                <ClipboardCheck className="h-4 w-4 text-gray-500" />
                {userDetails.testCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-white to-purple-50/30 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
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
                    className="block rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-sm"
                  >
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs capitalize text-gray-600">{org.role}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(userDetails.courses.length > 0 ||
        userDetails.paths.length > 0 ||
        userDetails.resources.length > 0 ||
        userDetails.tests.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {userDetails.courses.length > 0 ? (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
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
                      className="block rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-sm"
                    >
                      <p className="font-medium text-gray-900">{course.title}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
          {userDetails.paths.length > 0 ? (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Layers className="h-5 w-5" />
                  Parcours ({userDetails.paths.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userDetails.paths.map((path) => (
                    <div key={path.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="font-medium text-gray-900">{path.title}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
          {userDetails.resources.length > 0 ? (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <BookOpen className="h-5 w-5" />
                  Ressources ({userDetails.resources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userDetails.resources.map((resource) => (
                    <div key={resource.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="font-medium text-gray-900">{resource.title}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
          {userDetails.tests.length > 0 ? (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <FileText className="h-5 w-5" />
                  Tests ({userDetails.tests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userDetails.tests.map((test) => (
                    <div key={test.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="font-medium text-gray-900">{test.title}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {dossier ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Fiche de suivi apprenant</h2>
          <LearnerDossierPanel dossier={dossier} variant="default" />
        </div>
      ) : null}
    </div>
  );
}
