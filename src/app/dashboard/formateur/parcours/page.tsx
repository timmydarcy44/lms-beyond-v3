import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFormateurPaths, getFormateurLearners, getFormateurGroups, getFormateurContentLibrary } from "@/lib/queries/formateur";
import { ParcoursCardsClient } from "./parcours-cards-client";

const statusConfig: Record<string, { label: string; tone: string }> = {
  published: { label: "Publié", tone: "bg-emerald-500/20 text-emerald-100" },
  draft: { label: "Brouillon", tone: "bg-white/10 text-white/70" },
  scheduled: { label: "Programmé", tone: "bg-sky-500/15 text-sky-100" },
};


export default async function FormateurParcoursPage() {
  const [paths, learners, groups, contentLibrary] = await Promise.all([
    getFormateurPaths(),
    getFormateurLearners(),
    getFormateurGroups(),
    getFormateurContentLibrary(),
  ]);

  return (
    <DashboardShell
      title="Parcours formateur"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Parcours" },
      ]}
    >
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Mes parcours signatures</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Assemblez vos formations, tests et ressources propriétaires pour créer des parcours immersifs. Chaque parcours peut être
            déployé auprès de vos cohortes ou partagé avec vos équipes en quelques clics.
          </p>
        </div>
        <Button
          asChild
          className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
        >
          <Link href="/dashboard/formateur/parcours/new">Créer un parcours</Link>
        </Button>
      </section>

      <ParcoursCardsClient 
        paths={paths} 
        statusConfig={statusConfig}
        learners={learners}
        groups={groups}
        contentLibrary={{
          courses: contentLibrary.courses.map((c: any) => ({ id: c.id, title: c.title, status: c.status })),
          tests: contentLibrary.tests.map((t: any) => ({ id: t.id, title: t.title, status: t.status })),
          resources: contentLibrary.resources.map((r: any) => ({ id: r.id, title: r.title, published: r.published || false })),
        }}
      />

      {paths.length === 0 ? (
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-lg font-semibold">Pas encore de parcours</p>
            <p className="text-sm text-white/60">
              Combinez vos formations, tests et ressources pour créer un parcours signature. Tous vos contenus restent synchronisés.
            </p>
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              <Link href="/dashboard/formateur/parcours/new">Créer mon premier parcours</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </DashboardShell>
  );
}



