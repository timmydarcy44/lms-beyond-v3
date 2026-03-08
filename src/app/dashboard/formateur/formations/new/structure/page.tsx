import Link from "next/link";

import { CourseBuilderWorkspace } from "@/components/formateur/course-builder/course-builder-workspace";

export default function FormateurNewFormationStructurePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="px-6 py-6">
        <Link
          href="/dashboard/formateur/formations"
          className="text-sm text-white/60 hover:text-white"
        >
          ← Retour aux formations
        </Link>
      </div>
      <div className="px-6 pb-10">
        <CourseBuilderWorkspace previewHref="/dashboard/formateur/formations/new/preview" />
      </div>
    </div>
  );
}


