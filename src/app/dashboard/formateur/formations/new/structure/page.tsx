import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import { CourseBuilderWorkspace } from "@/components/formateur/course-builder/course-builder-workspace";

export default function FormateurNewFormationStructurePage() {
  return (
    <DashboardShell
      title="Structure & modules"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Formations", href: "/dashboard/formateur/formations" },
        { label: "Nouvelle formation", href: "/dashboard/formateur/formations/new" },
        { label: "Structure" },
      ]}
      initialCollapsed
    >
      <CourseBuilderWorkspace previewHref="/dashboard/formateur/formations/new/preview" />
    </DashboardShell>
  );
}


