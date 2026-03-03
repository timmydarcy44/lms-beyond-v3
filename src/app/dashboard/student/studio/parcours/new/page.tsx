import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PathBuilderWorkspace } from "@/components/formateur/path-builder/path-builder-workspace";
import { getFormateurContentLibrary } from "@/lib/queries/formateur";

export default async function FormateurNewParcoursPage() {
  const library = await getFormateurContentLibrary();

  return (
    <DashboardShell
      title="Créer un parcours"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/student/studio" },
        { label: "Formateur", href: "/dashboard/student/studio" },
        { label: "Parcours", href: "/dashboard/student/studio/parcours" },
        { label: "Nouveau" },
      ]}
    >
      <PathBuilderWorkspace library={library} />
    </DashboardShell>
  );
}











