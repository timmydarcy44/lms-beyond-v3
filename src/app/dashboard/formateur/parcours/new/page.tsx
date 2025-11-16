import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PathBuilderWorkspace } from "@/components/formateur/path-builder/path-builder-workspace";
import { getFormateurContentLibrary } from "@/lib/queries/formateur";

export default async function FormateurNewParcoursPage() {
  const library = await getFormateurContentLibrary();

  return (
    <DashboardShell
      title="Créer un parcours"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Parcours", href: "/dashboard/formateur/parcours" },
        { label: "Nouveau" },
      ]}
    >
      <PathBuilderWorkspace library={library} />
    </DashboardShell>
  );
}





