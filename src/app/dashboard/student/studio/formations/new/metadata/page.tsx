import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import { CourseMetadataWorkspace } from "@/components/formateur/course-builder/course-metadata-workspace";

export default function FormateurNewFormationMetadataPage() {
  return (
    <DashboardShell
      title="Création de formation"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/student/studio" },
        { label: "Formateur", href: "/dashboard/student/studio" },
        { label: "Formations", href: "/dashboard/student/studio/formations" },
        { label: "Nouvelle formation", href: "/dashboard/student/studio/formations/new" },
        { label: "Métadonnées" },
      ]}
      initialCollapsed
    >
      <CourseMetadataWorkspace />
    </DashboardShell>
  );
}








