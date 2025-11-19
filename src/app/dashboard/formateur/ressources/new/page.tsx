import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ResourceCreateForm } from "@/components/formateur/resource-builder/resource-create-form";

export default function FormateurRessourceCreatePage() {
  return (
    <DashboardShell
      title="Ajouter une ressource"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Ressources", href: "/dashboard/formateur/ressources" },
        { label: "Nouvelle" },
      ]}
    >
      <ResourceCreateForm />
    </DashboardShell>
  );
}







