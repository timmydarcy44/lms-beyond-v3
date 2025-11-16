import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, User, BookOpen, CheckCircle2, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { getFormateurLearners } from "@/lib/queries/formateur";
import { LearnerOnlineStatus } from "@/components/formateur/learner-online-status";

type PageProps = {
  params: Promise<{ learnerId: string }>;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LearnerDetailPage({ params }: PageProps) {
  const { learnerId } = await params;

  if (!learnerId) {
    notFound();
  }

  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) {
    notFound();
  }

  // Récupérer tous les apprenants du formateur pour vérifier l'accès
  const learners = await getFormateurLearners();
  const learner = learners.find((l) => l.id === learnerId);

  if (!learner) {
    notFound();
  }

  // Récupérer les détails complets de l'apprenant
  const adminClient = await getServiceRoleClientOrFallback();
  const profileClient = adminClient ?? supabase;

  // Paralléliser toutes les requêtes pour améliorer les performances
  const [
    profileResult,
    authUserResult,
    enrollmentsResult,
    documentsResult,
    testResultsResult,
    learningSessionsResult,
    courseProgressResult,
    pathProgressResult,
  ] = await Promise.all([
    // Profile
    profileClient
      .from("profiles")
      .select("id, full_name, first_name, last_name, email, role, created_at")
      .eq("id", learnerId)
      .single(),
    // Dernière connexion
    adminClient
      ? adminClient.auth.admin.getUserById(learnerId).catch(() => ({ data: { user: null }, error: null }))
      : Promise.resolve({ data: { user: null }, error: null }),
    // Cours assignés
    supabase
      .from("enrollments")
      .select(`
        id,
        course_id,
        created_at,
        courses (
          id,
          title,
          cover_image,
          status
        )
      `)
      .eq("user_id", learnerId)
      .eq("role", "student"),
    // Documents
    supabase
      .from("drive_documents")
      .select("id, title, created_at, status, ai_usage_score")
      .eq("author_id", learnerId)
      .order("created_at", { ascending: false })
      .limit(10),
    // Tests complétés
    supabase
      .from("test_results")
      .select(`
        id,
        test_id,
        score,
        completed_at,
        tests (
          id,
          title
        )
      `)
      .eq("user_id", learnerId)
      .order("completed_at", { ascending: false })
      .limit(10),
    // Sessions d'apprentissage
    adminClient
      ? adminClient
          .from("learning_sessions")
          .select("duration_seconds, duration_active_seconds, started_at, ended_at")
          .eq("user_id", learnerId)
      : supabase
          .from("learning_sessions")
          .select("duration_seconds, duration_active_seconds, started_at, ended_at")
          .eq("user_id", learnerId),
    // Progression cours
    supabase
      .from("course_progress")
      .select(`
        id,
        course_id,
        progress_percentage,
        last_accessed_at,
        courses (
          id,
          title
        )
      `)
      .eq("user_id", learnerId),
    // Progression parcours
    supabase
      .from("path_progress")
      .select(`
        id,
        path_id,
        progress_percentage,
        last_accessed_at,
        paths (
          id,
          title
        )
      `)
      .eq("user_id", learnerId),
  ]);

  const { data: profile } = profileResult;
  if (!profile) {
    notFound();
  }

  const lastSignIn = authUserResult.data?.user?.last_sign_in_at || null;
  const { data: enrollments } = enrollmentsResult;
  const { data: documents } = documentsResult;
  const { data: testResults } = testResultsResult;
  const { data: learningSessions, error: sessionsError } = learningSessionsResult;
  const { data: courseProgress } = courseProgressResult;
  const { data: pathProgress } = pathProgressResult;

  if (sessionsError) {
    console.error("[formateur/learner] Error fetching learning sessions:", sessionsError);
  }

  console.log("[formateur/learner] Learning sessions for", learnerId, ":", {
    count: learningSessions?.length || 0,
    sessions: learningSessions,
    error: sessionsError,
  });

  // Calculer le temps total et actif
  const totalTimeSeconds = learningSessions?.reduce((acc, session) => acc + (session.duration_seconds || 0), 0) || 0;
  const activeTimeSeconds = learningSessions?.reduce((acc, session) => acc + (session.duration_active_seconds || 0), 0) || 0;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const displayName = profile.full_name || 
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || 
    profile.email || 
    "Apprenant";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardShell
      title={displayName}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Mes apprenants", href: "/dashboard/formateur/apprenants" },
        { label: displayName },
      ]}
    >
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/formateur/apprenants">
            <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>

        {/* Informations principales */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 flex-shrink-0 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center text-white font-bold text-2xl">
                {initials}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/70">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <Badge className="rounded-full bg-emerald-500/20 text-emerald-200 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                        Apprenant
                      </Badge>
                    </div>
                    <LearnerOnlineStatus learnerId={learnerId} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/60">
                    {profile.created_at && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">Inscrit le :</span>
                        <span>{new Date(profile.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                      </div>
                    )}
                    {lastSignIn && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">Dernière connexion :</span>
                        <span>{new Date(lastSignIn).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 uppercase tracking-[0.3em]">Cours assignés</p>
                  <p className="mt-2 text-3xl font-bold text-white">{enrollments?.length || 0}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 uppercase tracking-[0.3em]">Documents déposés</p>
                  <p className="mt-2 text-3xl font-bold text-white">{documents?.length || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 uppercase tracking-[0.3em]">Tests complétés</p>
                  <p className="mt-2 text-3xl font-bold text-white">{testResults?.length || 0}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 uppercase tracking-[0.3em]">Temps de connexion</p>
                  <p className="mt-2 text-2xl font-bold text-white">{formatTime(totalTimeSeconds)}</p>
                  <p className="mt-1 text-xs text-white/50">Temps total</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 uppercase tracking-[0.3em]">Temps actif</p>
                  <p className="mt-2 text-2xl font-bold text-white">{formatTime(activeTimeSeconds)}</p>
                  <p className="mt-1 text-xs text-white/50">Avec activité</p>
                </div>
                <Clock className="h-8 w-8 text-emerald-400/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Cours assignés avec progression */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BookOpen className="h-5 w-5" />
                Cours assignés
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!enrollments || enrollments.length === 0 ? (
                <p className="text-sm text-white/60">Aucun cours assigné</p>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enrollment: any) => {
                    const course = enrollment.courses;
                    if (!course) return null;
                    const progress = courseProgress?.find((p: any) => p.course_id === course.id);
                    const progressPercentage = progress?.progress_percentage || 0;
                    return (
                      <div
                        key={enrollment.id}
                        className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-white">{course.title || "Cours sans titre"}</p>
                            <p className="mt-1 text-xs text-white/60">
                              Assigné le {new Date(enrollment.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <Badge
                            className={
                              course.status === "published"
                                ? "bg-emerald-500/20 text-emerald-200"
                                : "bg-gray-500/20 text-gray-200"
                            }
                          >
                            {course.status === "published" ? "Publié" : "Brouillon"}
                          </Badge>
                        </div>
                        {progress && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-white/70">
                              <span>Progression</span>
                              <span>{progressPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents récents */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                Documents récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!documents || documents.length === 0 ? (
                <p className="text-sm text-white/60">Aucun document déposé</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">{doc.title || "Document sans titre"}</p>
                        <p className="mt-1 text-xs text-white/60">
                          Déposé le {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      {doc.ai_usage_score !== null && (
                        <Badge
                          className={
                            doc.ai_usage_score >= 75
                              ? "bg-rose-500/20 text-rose-200"
                              : doc.ai_usage_score >= 50
                                ? "bg-orange-500/20 text-orange-200"
                                : "bg-emerald-500/20 text-emerald-200"
                          }
                        >
                          {doc.ai_usage_score}% IA
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progression dans les parcours */}
        {pathProgress && pathProgress.length > 0 && (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BookOpen className="h-5 w-5" />
                Progression dans les parcours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pathProgress.map((progress: any) => {
                  const path = progress.paths;
                  if (!path) return null;
                  const progressPercentage = progress.progress_percentage || 0;
                  return (
                    <div
                      key={progress.id}
                      className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-white">{path.title || "Parcours sans titre"}</p>
                          {progress.last_accessed_at && (
                            <p className="mt-1 text-xs text-white/60">
                              Dernier accès le {new Date(progress.last_accessed_at).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-200">
                          {progressPercentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tests complétés */}
        {testResults && testResults.length > 0 && (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle2 className="h-5 w-5" />
                Tests complétés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result: any) => {
                  const test = result.tests;
                  if (!test) return null;
                  return (
                    <div
                      key={result.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">{test.title || "Test sans titre"}</p>
                        <p className="mt-1 text-xs text-white/60">
                          Complété le {new Date(result.completed_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge
                        className={
                          result.score >= 80
                            ? "bg-emerald-500/20 text-emerald-200"
                            : result.score >= 60
                              ? "bg-yellow-500/20 text-yellow-200"
                              : "bg-red-500/20 text-red-200"
                        }
                      >
                        {result.score}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

