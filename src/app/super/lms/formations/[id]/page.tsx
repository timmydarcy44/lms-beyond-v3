import { FormateurFormationBuilderWhite } from "@/app/dashboard/formateur/formations/new/page";

export const dynamic = "force-dynamic";

export default async function SuperLmsFormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="super-lms-light min-h-[calc(100vh-5rem)] bg-[#F5F5F7] text-slate-900">
      <FormateurFormationBuilderWhite
        initialCourseId={id}
        byoundOwned
        editorBase="/super/lms/formations"
        returnTo="/super/lms/formations"
      />
    </div>
  );
}
