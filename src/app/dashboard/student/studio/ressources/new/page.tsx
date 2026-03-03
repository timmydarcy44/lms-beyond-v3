import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ResourceCreateForm } from "@/components/formateur/resource-builder/resource-create-form";

export default function FormateurRessourceCreatePage() {
  return (
    <DashboardShell
      title="Ajouter une ressource"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/student/studio" },
        { label: "Formateur", href: "/dashboard/student/studio" },
        { label: "Ressources", href: "/dashboard/student/studio/ressources" },
        { label: "Nouvelle" },
      ]}
    >
      <ResourceCreateForm />
    </DashboardShell>
  );
}











