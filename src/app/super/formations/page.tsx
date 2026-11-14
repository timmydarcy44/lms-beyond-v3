import type { Metadata } from "next";
import { Suspense } from "react";
import { SuperTrainingCoursesManager } from "@/components/super-admin/super-training-courses-manager";

export const metadata: Metadata = {
  title: "Gestion des formations | Super Admin",
  description: "Administrer le catalogue formations Byound Business.",
};

export const dynamic = "force-dynamic";

export default function SuperFormationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Chargement du studio…</div>}>
      <SuperTrainingCoursesManager />
    </Suspense>
  );
}
