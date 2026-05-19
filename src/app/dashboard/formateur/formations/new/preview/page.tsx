import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CourseLearnerPreview } from "@/components/formateur/course-builder/course-learner-preview";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function FormateurFormationPreviewPage() {
  return (
    <DashboardShell
      forcedTheme="light"
      className="bg-white text-slate-950"
      mainClassName="bg-white px-0 pb-0 pt-0"
      hideSidebar
      hideHeader
    >
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <a
            href="/dashboard/formateur"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            ← Retour au Dashboard
          </a>
          <div className="truncate text-sm font-semibold text-slate-500">Prévisualisation</div>
          <Button
            asChild
            variant="ghost"
            className="rounded-full bg-slate-100 px-5 text-slate-700 hover:bg-slate-200"
          >
            <Link href="/dashboard/formateur/formations/new">Revenir au builder</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8">
        <CourseLearnerPreview />
      </div>
    </DashboardShell>
  );
}











