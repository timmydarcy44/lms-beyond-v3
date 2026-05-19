"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import DriveEditor from "./drive-editor";

function DriveNewShellInner() {
  const searchParams = useSearchParams();
  const isCaseStudy = String(searchParams.get("kind") ?? "").trim() === "case_study";

  return (
    <DashboardShell
      title={isCaseStudy ? "Votre studio" : "Nouveau document"}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Drive", href: "/dashboard/student/tools/drive" },
        { label: isCaseStudy ? "Étude de cas" : "Nouveau document" },
      ]}
      forcedTheme={isCaseStudy ? "light" : undefined}
      className={isCaseStudy ? "!bg-white text-slate-900" : undefined}
      mainClassName={isCaseStudy ? "!bg-white" : undefined}
    >
      <DriveEditor />
    </DashboardShell>
  );
}

export default function DriveNewShell() {
  return (
    <Suspense fallback={null}>
      <DriveNewShellInner />
    </Suspense>
  );
}
