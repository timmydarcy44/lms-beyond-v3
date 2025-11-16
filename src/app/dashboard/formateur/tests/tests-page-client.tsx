"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, MessageSquare } from "lucide-react";
import { TestCourseAssignmentModal } from "@/components/formateur/tests/test-course-assignment-modal";
import { TestResultMessagesModal } from "@/components/formateur/tests/test-result-messages-modal";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { type FormateurTestListItem } from "@/lib/queries/formateur";

const statusStyles: Record<"published" | "draft" | "scheduled", { label: string; tone: string }> = {
  published: { label: "Publié", tone: "bg-emerald-500/15 text-emerald-200" },
  draft: { label: "Brouillon", tone: "bg-white/10 text-white/70" },
  scheduled: { label: "Programmé", tone: "bg-sky-500/15 text-sky-100" },
};

type TestsPageClientProps = {
  initialTests: FormateurTestListItem[];
};

export function TestsPageClient({ initialTests }: TestsPageClientProps) {
  const [testsLibrary, setTestsLibrary] = useState<FormateurTestListItem[]>(initialTests);
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<FormateurTestListItem | null>(null);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);

  const totalAttempts = testsLibrary.reduce((acc, test) => acc + test.attempts, 0);
  const published = testsLibrary.filter((test) => test.status === "published");
  const drafts = testsLibrary.filter((test) => test.status === "draft");

  const handlePublish = async (testId: string, currentStatus: "draft" | "published" | "scheduled") => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    setPublishingIds((prev) => new Set(prev).add(testId));

    try {
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la publication");
      }

      // Mettre à jour l'état local
      setTestsLibrary((prev) =>
        prev.map((test) => (test.id === testId ? { ...test, status: newStatus as "published" | "draft" } : test))
      );

      toast.success(newStatus === "published" ? "Test publié !" : "Test retiré de la publication");
    } catch (error) {
      console.error("Erreur lors de la publication:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la publication.",
      });
    } finally {
      setPublishingIds((prev) => {
        const next = new Set(prev);
        next.delete(testId);
        return next;
      });
    }
  };

  return (
    <DashboardShell
      title="Tests formateur"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Tests" },
      ]}
    >
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Mes évaluations</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Centralisez vos évaluations, suivez la performance de vos cohortes et préparez vos prochaines séquences d'entraînement.
            Les données seront synchronisées avec Supabase pour vos dashboards analytics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            <Link href="/dashboard/formateur/tests/new">Créer un test</Link>
          </Button>
          <Button
            variant="ghost"
            className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:border-white/40 hover:text-white"
          >
            Importer un questionnaire
          </Button>
        </div>
      </section>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="grid gap-6 p-6 md:grid-cols-4">
          <StatTile label="Tests publiés" value={published.length} hint="Disponibles" tone="bg-emerald-500/15 text-emerald-200" />
          <StatTile label="Brouillons" value={drafts.length} hint="À finaliser" tone="bg-white/10 text-white/70" />
          <StatTile label="Tentatives cumulées" value={totalAttempts} hint="30 derniers jours" tone="bg-sky-500/15 text-sky-100" />
          <StatTile 
            label="Score moyen" 
            value={testsLibrary.length > 0 ? Math.round(testsLibrary.reduce((acc, test) => acc + test.averageScore, 0) / testsLibrary.length) : 0} 
            suffix="%" 
            hint="Tous tests confondus" 
            tone="bg-purple-500/20 text-purple-100" 
          />
        </CardContent>
      </Card>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
          <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1 text-white/70">
            Tous ({testsLibrary.length})
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">
            Publiés ({published.length})
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1 text-white/70">
            Brouillons ({drafts.length})
          </Badge>
        </div>
        {testsLibrary.length === 0 ? (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-semibold text-white">Aucun test</p>
              <p className="mt-2 text-sm text-white/60">
                Créez votre premier test pour commencer à évaluer vos apprenants.
              </p>
              <Button asChild className="mt-6 rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                <Link href="/dashboard/formateur/tests/new">Créer un test</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {testsLibrary.map((test) => (
              <Card
                key={test.id}
                className="group flex h-full flex-col overflow-hidden border border-white/10 bg-gradient-to-br from-[#111827]/75 via-[#0B1220]/80 to-[#020617]/85"
              >
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {test.tag && (
                      <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
                        {test.tag}
                      </Badge>
                    )}
                    <Badge className={cn('rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]', statusStyles[test.status].tone)}>
                      {statusStyles[test.status].label}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold text-white">{test.title}</CardTitle>
                  <p className="text-xs text-white/50">
                    Dernière mise à jour {formatDistanceToNow(new Date(test.lastUpdated), { addSuffix: true, locale: fr })}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-white/70">{test.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-white/60">
                    <span className="rounded-full bg-white/5 px-3 py-1">{test.type}</span>
                    <span className="rounded-full bg-white/5 px-3 py-1">{test.attempts} tentatives</span>
                    <span className="rounded-full bg-white/5 px-3 py-1">Score moyen {test.averageScore}%</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Taux de réussite</span>
                      <span>{test.averageScore}%</span>
                    </div>
                    <Progress value={test.averageScore} className="h-2" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      <Link href={`/dashboard/formateur/tests/${test.id ?? 'new'}/edit`}>Configurer</Link>
                    </Button>
                    <Button
                      onClick={async () => {
                        setSelectedTest(test);
                        // Charger les formations du formateur
                        try {
                          const response = await fetch("/api/formateur/courses");
                          const data = await response.json();
                          setCourses(data.courses || []);
                          setAssignmentModalOpen(true);
                        } catch (error) {
                          console.error("Error loading courses:", error);
                          toast.error("Erreur lors du chargement des formations");
                        }
                      }}
                      variant="outline"
                      className="rounded-full border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white hover:bg-white/10"
                    >
                      <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                      Assigner à une formation
                    </Button>
                    <Button
                      onClick={async () => {
                        setSelectedTest(test);
                        // Charger les messages existants
                        try {
                          const response = await fetch(`/api/tests/${test.id}/result-messages`);
                          const data = await response.json();
                          setMessagesModalOpen(true);
                        } catch (error) {
                          console.error("Error loading messages:", error);
                          setMessagesModalOpen(true);
                        }
                      }}
                      variant="outline"
                      className="rounded-full border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white hover:bg-white/10"
                    >
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                      Messages résultats
                    </Button>
                    <Button
                      onClick={() => handlePublish(test.id, test.status)}
                      disabled={publishingIds.has(test.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white",
                        test.status === "published"
                          ? "bg-white/10 hover:bg-white/20"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      )}
                    >
                      {publishingIds.has(test.id)
                        ? "Publication..."
                        : test.status === "published"
                          ? "Dépublier"
                          : "Publier"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-[0.3em] text-white/60">Tests à enrichir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {testsLibrary.filter((test) => test.status !== "published").length === 0 ? (
            <p className="text-center text-sm text-white/60">Aucun test à enrichir</p>
          ) : (
            testsLibrary
              .filter((test) => test.status !== "published")
              .map((test) => (
                <div
                  key={test.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">{test.title}</p>
                    <p className="text-xs text-white/50">
                      Mise à jour {formatDistanceToNow(new Date(test.lastUpdated), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-[0.3em] text-white/40">Score moyen {test.averageScore}%</span>
                    <Button
                      variant="ghost"
                      className="rounded-full border border-white/20 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/80 hover:border-white/40 hover:text-white"
                    >
                      Continuer
                    </Button>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedTest && (
        <>
          <TestCourseAssignmentModal
            open={assignmentModalOpen}
            onOpenChange={setAssignmentModalOpen}
            testId={selectedTest.id}
            testTitle={selectedTest.title}
            courses={courses}
            onAssign={async (assignment) => {
              const response = await fetch("/api/tests/assign-to-course", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  testId: selectedTest.id,
                  ...assignment,
                }),
              });

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erreur lors de l'assignation");
              }
            }}
          />

          <TestResultMessagesModal
            open={messagesModalOpen}
            onOpenChange={setMessagesModalOpen}
            testId={selectedTest.id}
            testTitle={selectedTest.title}
            onSave={async (messages) => {
              const response = await fetch(`/api/tests/${selectedTest.id}/result-messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages }),
              });

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erreur lors de la sauvegarde");
              }
            }}
          />
        </>
      )}
    </DashboardShell>
  );
}

function StatTile({
  label,
  value,
  suffix,
  hint,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  tone: string;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</p>
      <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold", tone)}>
        {value}
        {suffix ? <span>{suffix}</span> : null}
      </span>
      {hint ? <p className="text-xs text-white/50">{hint}</p> : null}
    </div>
  );
}
