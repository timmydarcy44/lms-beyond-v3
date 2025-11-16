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
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Espace de dépôt apprenants</h1>
          <p className="max-w-3xl text-sm text-white/70">
            Visualisez les documents créés dans le studio apprenant et concentrez-vous sur ceux qui exploitent fortement l'IA. Chaque
            fichier est horodaté et attribué à son auteur pour faciliter vos retours personnalisés.
          </p>
        </div>
        <Button
          asChild
          className="rounded-full bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-[#8E2DE2]/40"
        >
          <Link href="#drive-consigne">Créer une consigne</Link>
        </Button>
      </section>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            Synthèse du drive • mise à jour {format(new Date(), "PPPp", { locale: fr })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DriveStorageSummary documents={documents} />
        </CardContent>
      </Card>

      <DriveStorageTable documents={documents} learners={learners} groups={groups} />
      <div id="drive-consigne" className="h-1" />
    </DashboardShell>
  );
}


