import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFormateurLearners, getFormateurAssignableContent, getFormateurGroups } from "@/lib/queries/formateur";
import { Users } from "lucide-react";
import { LearnerAssignmentClient } from "./learner-assignment-client";

// Désactiver le cache pour cette page afin de toujours avoir les données à jour
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FormateurApprenantsPage() {
  // Paralléliser les requêtes pour améliorer les performances
  const [learnersResult, groupsResult, assignableContentResult] = await Promise.all([
    getFormateurLearners(),
    getFormateurGroups(),
    getFormateurAssignableContent(),
  ]);

  // Log pour debugging AVANT Promise.all pour voir les résultats individuels
  console.log("[formateur/apprenants] Learners result:", {
    count: learnersResult.length,
    learners: learnersResult.map(l => ({ id: l.id, email: l.email, name: l.full_name })),
  });
  console.log("[formateur/apprenants] Groups result:", {
    count: groupsResult.length,
  });
  console.log("[formateur/apprenants] Assignable content result:", {
    courses: assignableContentResult.courses.length,
    tests: assignableContentResult.tests.length,
    resources: assignableContentResult.resources.length,
  });

  return (
    <DashboardShell
      title="Mes apprenants"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Mes apprenants" },
      ]}
    >
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-white md:text-3xl">Mes apprenants</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Gérez vos apprenants et suivez leur progression dans vos formations. Vous pouvez les assigner à vos cours depuis cette interface.
            </p>
          </div>
          <Badge className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
            {learnersResult.length} apprenant{learnersResult.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {learnersResult.length === 0 && groupsResult.length === 0 ? (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-white/10 p-4">
                <Users className="h-8 w-8 text-white/40" />
              </div>
              <p className="text-lg font-semibold text-white">Aucun apprenant ni groupe</p>
              <p className="mt-2 max-w-md text-sm text-white/60">
                Vous n'avez pas encore d'apprenants ou de groupes assignés. Les apprenants et groupes que vous assignerez à vos formations apparaîtront ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <LearnerAssignmentClient learners={learnersResult} groups={groupsResult} assignableContent={assignableContentResult} />
        )}
      </section>
    </DashboardShell>
  );
}

