"use client";

import { Suspense } from "react";
import { TeamDirectoryPage } from "@/components/enterprise/team-directory-page";

export default function EntrepriseDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F4F1]" />}>
      <TeamDirectoryPage />
    </Suspense>
  );
}
