import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CourseLearnerPreview } from "@/components/formateur/course-builder/course-learner-preview";
import { Button } from "@/components/ui/button";

export default function FormateurFormationPreviewPage() {
  return (
    <DashboardShell
      title="Vue apprenant"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Formations", href: "/dashboard/formateur/formations" },
        { label: "Nouvelle formation", href: "/dashboard/formateur/formations/new" },
        { label: "Prévisualisation" },
      ]}
      initialCollapsed
    >
      <div className="space-y-6">
        <Button
          asChild
          variant="ghost"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/40 hover:text-white"
        >
          <Link href="/dashboard/formateur/formations/new/structure">Revenir au builder</Link>
        </Button>
        <CourseLearnerPreview />
      </div>
    </DashboardShell>
  );
}










