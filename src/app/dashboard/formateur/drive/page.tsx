import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DriveStorageTable } from "@/components/formateur/drive/drive-storage-table";
import { DriveStorageSummary } from "@/components/formateur/drive/drive-storage-summary";
import { getFormateurDriveDocuments, getFormateurLearners, getFormateurGroups } from "@/lib/queries/formateur";
import { getSession } from "@/lib/auth/session";

export default async function FormateurDrivePage() {
  const [documents, learners, groups] = await Promise.all([
    getFormateurDriveDocuments(),
    getFormateurLearners(),
    getFormateurGroups(),
  ]);
  const session = await getSession();

  return (
    <DashboardShell
      title="Drive formateur"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Drive" },
      ]}
      firstName={session?.fullName ?? null}
      email={session?.email ?? null}
    >
      <div className="space-y-16 pt-2">
        <section className="rounded-3xl border border-white/10 bg-slate-950/80 px-6 py-10 md:px-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-white md:text-[2.4rem] md:leading-tight">
                Espace de lecture et d’analyse des productions apprenantes
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-white/70 md:text-base">
                Consultez les documents déposés par vos apprenants, identifiez ceux qui méritent un retour prioritaire et
                apportez un regard pédagogique contextualisé. Les indicateurs IA sont fournis à titre d’aide et restent non
                déterminants.
              </p>
            </div>
            <Button
              asChild
              className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-cyan-500/30 focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <Link href="#drive-consigne">Créer une consigne</Link>
            </Button>
          </div>
        </section>

        <Card className="border border-white/10 bg-slate-950/75 text-white">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-white/55">
              Synthèse rapide • mise à jour {format(new Date(), "PPPp", { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DriveStorageSummary documents={documents} />
          </CardContent>
        </Card>

        <DriveStorageTable documents={documents} learners={learners} groups={groups} />
      </div>
      <div id="drive-consigne" className="h-1" />
    </DashboardShell>
  );
}


