import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CourseCreationOptions } from "@/components/formateur/course-creation-options";

export default function FormateurNewFormationPage() {
  return (
    <DashboardShell
      title="Création de formation"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/student/studio" },
        { label: "Formateur", href: "/dashboard/student/studio" },
        { label: "Formations", href: "/dashboard/student/studio/formations" },
        { label: "Nouvelle formation" },
      ]}
      initialCollapsed
    >
      <CourseCreationOptions />
    </DashboardShell>
  );
}

