import { FormateurFormationBuilderWhite } from "@/app/dashboard/formateur/formations/new/page";

export const dynamic = "force-dynamic";

export default async function SuperLmsFormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="super-lms-light min-h-screen bg-[#F4F4F1] text-slate-900">
      <FormateurFormationBuilderWhite
        initialCourseId={id}
        byoundOwned
        editorBase="/super/lms/formations"
        returnTo="/super/lms/formations"
      />
    </div>
  );
}
