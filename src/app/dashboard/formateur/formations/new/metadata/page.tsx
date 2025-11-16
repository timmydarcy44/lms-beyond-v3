import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import { CourseMetadataWorkspace } from "@/components/formateur/course-builder/course-metadata-workspace";

export default function FormateurNewFormationMetadataPage() {
  return (
    <DashboardShell
      title="Création de formation"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Formations", href: "/dashboard/formateur/formations" },
        { label: "Nouvelle formation", href: "/dashboard/formateur/formations/new" },
        { label: "Métadonnées" },
      ]}
      initialCollapsed
    >
      <CourseMetadataWorkspace />
    </DashboardShell>
  );
}


