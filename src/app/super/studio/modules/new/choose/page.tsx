import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminCourseCreationOptions } from "@/components/super-admin/course-creation-options";

type PageProps = {
  searchParams: Promise<{ assignment_type?: string }>;
};

export default async function SuperAdminNewModuleChoosePage({ searchParams }: PageProps) {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const assignmentType = params.assignment_type as "no_school" | "organization" | undefined;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Création de module
        </h1>
        <p className="text-gray-600 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          {assignmentType === "no_school" 
            ? "Créer une formation pour Beyond No School"
            : assignmentType === "organization"
            ? "Créer une formation pour une organisation"
            : "Choisissez votre méthode de création de module"}
        </p>
      </div>
      <SuperAdminCourseCreationOptions assignmentType={assignmentType} />
    </main>
  );
}

