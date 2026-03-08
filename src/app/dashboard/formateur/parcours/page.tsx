import Link from "next/link";

import { FormateurSidebar } from "@/components/formateur/formateur-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFormateurPaths, getFormateurLearners, getFormateurGroups, getFormateurContentLibrary } from "@/lib/queries/formateur";
import { ParcoursCardsClient } from "./parcours-cards-client";

const statusConfig: Record<string, { label: string; tone: string }> = {
  published: { label: "Publié", tone: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-100" },
  draft: { label: "À peaufiner", tone: "border border-amber-400/30 bg-amber-500/15 text-amber-100" },
  scheduled: { label: "Programmé", tone: "border border-sky-400/30 bg-sky-500/15 text-sky-100" },
};


export default async function FormateurParcoursPage() {
  const [paths, learners, groups, contentLibrary] = await Promise.all([
    getFormateurPaths(),
    getFormateurLearners(),
    getFormateurGroups(),
    getFormateurContentLibrary(),
  ]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <FormateurSidebar activeItem="Parcours" />
      <main className="ml-[236px] px-10 py-10 space-y-10">
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
      </main>
    </div>
  );
}



