import { FormateurFormationBuilderWhite } from "@/app/dashboard/formateur/formations/new/page";

export const dynamic = "force-dynamic";

export default function SuperLmsNewFormationPage() {
  return (
    <div className="super-lms-light min-h-screen bg-[#F4F4F1] text-slate-900">
      <FormateurFormationBuilderWhite
        byoundOwned
        editorBase="/super/lms/formations"
        returnTo="/super/lms/formations"
      />
    </div>
  );
}
