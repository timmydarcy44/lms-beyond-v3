import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import { CourseBuilderWorkspace } from "@/components/formateur/course-builder/course-builder-workspace";

export default function FormateurNewFormationStructurePage() {
  return (
    <DashboardShell
      title="Structure & modules"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/student/studio" },
        { label: "Formateur", href: "/dashboard/student/studio" },
        { label: "Formations", href: "/dashboard/student/studio/formations" },
        { label: "Nouvelle formation", href: "/dashboard/student/studio/formations/new" },
        { label: "Structure" },
      ]}
      initialCollapsed
    >
      <CourseBuilderWorkspace previewHref="/dashboard/student/studio/formations/new/preview" />
    </DashboardShell>
  );
}


