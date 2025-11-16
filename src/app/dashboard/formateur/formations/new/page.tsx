import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CourseCreationOptions } from "@/components/formateur/course-creation-options";

export default function FormateurNewFormationPage() {
  return (
    <DashboardShell
      title="Création de formation"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Formations", href: "/dashboard/formateur/formations" },
        { label: "Nouvelle formation" },
      ]}
      initialCollapsed
    >
      <CourseCreationOptions />
    </DashboardShell>
  );
}

