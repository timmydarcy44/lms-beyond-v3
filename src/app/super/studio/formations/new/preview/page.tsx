"use client";

import { CourseLearnerPreview } from "@/components/formateur/course-builder/course-learner-preview";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SuperAdminNewFormationPreviewPage() {
  const snapshot = useCourseBuilder((state) => state.snapshot);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Aperçu de la formation
        </h1>
        <p className="text-gray-600 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Visualisez votre formation telle qu&apos;elle apparaîtra aux apprenants
        </p>
      </div>
      <div className="space-y-6">
        <Button
          asChild
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Link href="/super/studio/formations/new/structure">Revenir au builder</Link>
        </Button>
        <CourseLearnerPreview snapshot={snapshot} />
      </div>
    </main>
  );
}

